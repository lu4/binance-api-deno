import { Parser } from './parser.ts';

import { red } from "https://deno.land/std/fmt/colors.ts";
import { connectWebSocket, isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts";

export function listener<T>(url: string, parser: Parser<T, never>): AsyncGenerator<T, void, unknown>;
export function listener<T, O = never>(url: string, parser: Parser<T, O>, options: O): AsyncGenerator<T, void, unknown>;
export async function* listener<T, O = never>(url: string, parser: Parser<T, O> | Parser<T>, options?: O) {
    let proceed = true;

    while (proceed) {
        try {
            const socket = await connectWebSocket(url);

            for await (let message of socket) {
                if (typeof message === "string") {
                    yield parser(message, options as never);
                } else if (isWebSocketCloseEvent(message)) {
                    await socket.close();
                    console.log(red(`closed: code=${message.code}, reason=${message.reason}`));
                    break;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
}
