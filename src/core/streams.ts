import { EventStoreDBClient, EventType, RecordedEvent, ResolvedEvent, StreamingRead } from '@eventstore/db-client';
import dotenv from 'dotenv';
dotenv.config();

// The when method that is applied to each event to build the current state.
export type ApplyEvent<Entity, E extends EventType> = (
    currentState: Entity | undefined,
    event: RecordedEvent<E>,
  ) => Entity;

// Gets events and applies the when method one by one to each event to build current state.
export const StreamAggregator =
  <Entity, StreamEvents extends EventType>(
    when: ApplyEvent<Entity, StreamEvents>,
  ) =>
  async (
    eventStream: StreamingRead<ResolvedEvent<StreamEvents>>,
  ): Promise<Entity> => {
    let currentState: Entity | undefined = undefined;
    for await (const { event } of eventStream) {
      if (!event) continue;
      currentState = when(currentState, event);
    }
    if (currentState == null) throw StreamAggregatorErrors.STREAM_WAS_NOT_FOUND;
    return currentState;
  };

const enum StreamAggregatorErrors {
    STREAM_WAS_NOT_FOUND = "STREAM_WAS_NOT_FOUND",
};

// ESDB

let eventStore: EventStoreDBClient;

// Connects to event store
export const getEventStore = (connectionString?: string) => {
  if (!eventStore) {
    eventStore = EventStoreDBClient.connectionString(
      connectionString ?? (process.env.ESDB_CONNECTION_STRING || ''),
    );
  }

  return eventStore;
};