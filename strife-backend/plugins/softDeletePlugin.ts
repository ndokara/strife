import {
  HydratedDocument,
  Model,
  QueryWithHelpers,
  Schema,
  Query,
} from 'mongoose';

export interface SoftDeleteQueryHelpers<T> {
  notDeleted(
    this: QueryWithHelpers<HydratedDocument<T>[], HydratedDocument<T>, SoftDeleteQueryHelpers<T>>):
    QueryWithHelpers<HydratedDocument<T>[], HydratedDocument<T>, SoftDeleteQueryHelpers<T>>;

  withDeleted(
    this: QueryWithHelpers<HydratedDocument<T>[], HydratedDocument<T>, SoftDeleteQueryHelpers<T>>):
    QueryWithHelpers<HydratedDocument<T>[], HydratedDocument<T>, SoftDeleteQueryHelpers<T>>;
}

export function softDeletePlugin<T, M extends Model<T, SoftDeleteQueryHelpers<T>>>(schema: Schema<T, M, object, SoftDeleteQueryHelpers<T>>) {
  const fieldName = 'deletedAt';

  // Query helpers
  schema.query.notDeleted = function(
    this: QueryWithHelpers<HydratedDocument<T>[], HydratedDocument<T>, SoftDeleteQueryHelpers<T>>) {
    return this.find({ [fieldName]: null });
  };

  schema.query.withDeleted = function(
    this: QueryWithHelpers<HydratedDocument<T>[], HydratedDocument<T>, SoftDeleteQueryHelpers<T>>) {
    return this.setOptions({ withDeleted: true });
  };

  // Middleware to exclude deleted docs by default
  function addNotDeletedCondition(this: Query<HydratedDocument<T>[], HydratedDocument<T>>, next: () => void) {
    if (!this.getOptions().withDeleted) {
      this.where({ [fieldName]: null });
    }
    next();
  }

  const middlewareOps = [
    'count',
    'countDocuments',
    'find',
    'findOne',
    'findOneAndUpdate',
    'update',
    'updateOne',
    'updateMany',
  ] as const;

  for (const op of middlewareOps) {
    schema.pre(op as never, addNotDeletedCondition);
  }
}
