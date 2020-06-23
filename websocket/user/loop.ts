import { listener } from "../listener.ts";

import { Parser } from "../parser.ts";
import { RestClient, DataStream } from "../../rest/client.ts";

interface Communicator {
    timer: number;
    proceed: boolean;
    resolve: () => void;
}

export interface UserInfo {
    eventType: string;
    eventTime: number;
    balances: {
        [index: string]: {
            available: string;
            locked: string;
        };
    };
}

let url = (base: string, key: string) => {
    return `${base}/${key}`;
}

let parser: Parser<UserInfo> = (message: string) => {
    return JSON.parse(message);
}

async function keepAlive(dataStream: DataStream, interval: number, communicator: Communicator, client: RestClient) {
    while (true) {
        await new Promise(resolve => communicator.timer = setTimeout(communicator.resolve = resolve, interval));

        if (communicator.proceed) {
            await client.keepDataStream(dataStream);
        } else {
            break;
        }
    }
}

export async function* user(domain: string, client: RestClient, keepAliveInterval: number = 1800000) {
    let dataStream = await client.getDataStream();

    let communicator: Communicator = {
        timer: 0,
        proceed: true,
        resolve: () => void 0
    };

    keepAlive(dataStream, keepAliveInterval, communicator, client);

    try {
        for await (let item of listener<UserInfo>(url(domain, dataStream.listenKey), parser)) {
            yield item;
        }
    } finally {
        clearTimeout(communicator.timer);
        communicator.proceed = false;
        communicator.resolve();
    }
}