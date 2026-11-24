// POST /api/leaderboard/join
import { postJoin, type Env } from '../../../src/site/leaderboard-server';

export const onRequestPost = ({ request, env }: { request: Request; env: Env }) => postJoin(request, env);
