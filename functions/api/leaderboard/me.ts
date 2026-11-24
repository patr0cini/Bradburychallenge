// POST /api/leaderboard/me
import { postMe, type Env } from '../../../src/site/leaderboard-server';

export const onRequestPost = ({ request, env }: { request: Request; env: Env }) => postMe(request, env);
