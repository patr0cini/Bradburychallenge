// GET /api/leaderboard
import { getBoard, type Env } from '../../../src/site/leaderboard-server';

export const onRequestGet = ({ env }: { env: Env }) => getBoard(env);
