import { z } from 'zod/v4';

export const NewPerson = z.object({
  name: z.string().trim().min(1),
  age: z.number().positive().max(150),
});
export type NewPerson = z.infer<typeof NewPerson>;

export const Person = NewPerson.extend({
  id: z.number().int().positive(),
});
export type Person = z.infer<typeof Person>;
