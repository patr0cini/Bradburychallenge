// POST /api/leaderboard/checkin
import { postCheckin, type Env } from '../../../src/site/leaderboard-server';

export const onRequestPost = ({ request, env }: { request: Request; env: Env }) => postCheckin(request, env);
