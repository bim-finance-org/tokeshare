import { User } from 'next-auth';

export type TokeshareUser = User & { role: string };
