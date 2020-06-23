import { CandleIntervalDuration } from "./candle-interval-duration.ts";

export type Interval = keyof (typeof CandleIntervalDuration)
