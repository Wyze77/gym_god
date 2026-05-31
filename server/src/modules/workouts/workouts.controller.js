import asyncHandler from '../../utils/asyncHandler.js';
import * as workoutsService from './workouts.service.js';

export const create = asyncHandler(async (req, res) => {
  const result = await workoutsService.create(req.user.id, req.body);
  res.status(201).json(result);
});

export const list = asyncHandler(async (req, res) => {
  const result = await workoutsService.list(req.user.id, req.query);
  res.status(200).json(result);
});

export const getLast = asyncHandler(async (req, res) => {
  const workout = await workoutsService.getLast(req.user.id);
  res.status(200).json({ workout });
});

export const getOne = asyncHandler(async (req, res) => {
  const workout = await workoutsService.getById(req.user.id, Number(req.params.id));
  res.status(200).json({ workout });
});

export const remove = asyncHandler(async (req, res) => {
  await workoutsService.remove(req.user.id, Number(req.params.id));
  res.status(204).send();
});
