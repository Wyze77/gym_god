import asyncHandler from '../../utils/asyncHandler.js';
import * as goalsService from './goals.service.js';

export const list = asyncHandler(async (req, res) => {
  const goals = await goalsService.list(req.user.id);
  res.status(200).json({ goals });
});

export const create = asyncHandler(async (req, res) => {
  const goal = await goalsService.create(req.user.id, req.body);
  res.status(201).json({ goal });
});

export const update = asyncHandler(async (req, res) => {
  const goal = await goalsService.update(req.user.id, Number(req.params.id), req.body);
  res.status(200).json({ goal });
});

export const remove = asyncHandler(async (req, res) => {
  await goalsService.remove(req.user.id, Number(req.params.id));
  res.status(204).send();
});
