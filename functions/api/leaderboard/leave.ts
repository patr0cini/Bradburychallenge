// POST /api/leaderboard/leave
import { postLeave, type Env } from '../../../src/site/leaderboard-server';

export const onRequestPost = ({ request, env }: { request: Request; env: Env }) => postLeave(request, env);
