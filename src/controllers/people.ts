import { NextFunction, Request, Response } from 'express';
import { z } from 'zod/v4';
import { HttpError } from '../errors';
import { NewPerson, Person } from '../database/types';
import { AppContext } from '../app';

const PersonIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

export interface PeopleController {
  getAllPeople(req: Request, res: Response<Person[]>, next: NextFunction): Promise<void>;
  getPersonById(req: Request, res: Response<Person>, next: NextFunction): Promise<void>;
  addPerson(req: Request, res: Response<Person>, next: NextFunction): Promise<void>;
}

export const makePeopleController = ({ queries }: AppContext): PeopleController => {
  return {
    getAllPeople: async (req, res) => {
      const people = await queries.getAllPeople();
      res.send(people);
    },
    getPersonById: async (req, res) => {
      const { id } = PersonIdParam.parse(req.params);
      const person = await queries.getPersonById(id);
      if (!person) {
        throw new HttpError(404, 'Person not found');
      }
      res.send(person);
    },
    addPerson: async (req, res) => {
      const person = NewPerson.parse(req.body);
      const newPerson = await queries.addPerson(person);
      res.send(newPerson);
    },
  };
};
