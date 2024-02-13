import { Collection, Document, MongoClient, ObjectId, UpdateResult } from "mongodb";
import { DEFAULT_RETRY_OPTIONS, RetryOptions, retryPromise } from "./retries";
import { Checkpoint, EventHandler, SubscriptionResolvedEvent, SubscriptionToAll } from "./subscriptions";
import { getEventStore } from "./streams";

let mongoClient: MongoClient;

// Connect to local MongoDB Database
export const getMongoDB = async (
    connectionString?: string,
  ): Promise<MongoClient> => {
    if (!mongoClient) {
      mongoClient = new MongoClient(
        connectionString ?? (process.env.MONGODB_CONNECTION_STRING || ''),
        {
          directConnection: true,
        },
      );
      await mongoClient.connect();
    }
  
    return mongoClient;
};

export type ExecuteOnMongoDBOptions =
  | {
      collectionName: string;
      databaseName?: string;
    }
  | string;

  // Get Mongo Collection
export const getMongoCollection = async <Doc extends Document>(
    options: ExecuteOnMongoDBOptions,
    ): Promise<Collection<Doc>> => {
    const mongo = await getMongoDB();
  
    const { databaseName, collectionName } =
      typeof options !== 'string'
        ? options
        : { databaseName: undefined, collectionName: options };
  
    const db = mongo.db(databaseName);
    return db.collection<Doc>(collectionName);
};

// Convert to ObjectId
export const toObjectId = (id: string) => id as unknown as ObjectId;

export const enum MongoDBErrors {
  FAILED_TO_UPDATE_DOCUMENT = 'FAILED_TO_UPDATE_DOCUMENT',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
}

// Check if documents were updated
export const assertUpdated = async (
    update: () => Promise<UpdateResult>,
  ): Promise<UpdateResult> => {
    const result = await update();
  
    if (result.modifiedCount === 0) {
      throw MongoDBErrors.FAILED_TO_UPDATE_DOCUMENT;
    }
  
    return result;
  };
  
// Check if documents were found
export const assertFound = async <T>(
  find: () => Promise<T | null>,
): Promise<T> => {
  const result = await find();

  if (result === null) {
    throw MongoDBErrors.DOCUMENT_NOT_FOUND;
  }

  return result;
};

// Retries

// Retries the find operation if documents were not found.
export const retryIfNotFound = <T>(
    find: () => Promise<T | null>,
    options: RetryOptions = DEFAULT_RETRY_OPTIONS,
  ): Promise<T> => {
    return retryPromise(() => assertFound(find), options);
  };

// Retries the update operation if documents were not updated.
export const retryIfNotUpdated = (
  update: () => Promise<UpdateResult>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS,
): Promise<UpdateResult> => {
  return retryPromise(() => assertUpdated(update), options);
};

// MongoDB Checkpointing

// Get Checkpoints
export const getCheckpointsCollection = () =>
  getMongoCollection<Checkpoint>('checkpoints');

// Load checkpoint from id.
export const loadCheckPointFromCollection = async (subscriptionId: string) => {
  const checkpoints = await getCheckpointsCollection();

  const checkpoint = await checkpoints.findOne({
    _id: toObjectId(subscriptionId),
  });

  return checkpoint != null ? BigInt(checkpoint.position) : undefined;
};

// Store checkpoint after handled event
export const storeCheckpointInCollection =
  (handle: EventHandler) => async (event: SubscriptionResolvedEvent) => {
    await handle(event);
    const checkpoints = await getCheckpointsCollection();

    await checkpoints.updateOne(
      {
        _id: toObjectId(event.subscriptionId),
      },
      {
        $set: {
          position: event.commitPosition!.toString(),
        },
      },
      {
        upsert: true,
      },
    );
};
  
// Starts subscription process to listen for events on the event store and to update current state through the read model.
export const SubscriptionToAllWithMongoCheckpoints = SubscriptionToAll(
    getEventStore(),
    loadCheckPointFromCollection,
);