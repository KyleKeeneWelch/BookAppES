import { AllStreamResolvedEvent, EventStoreDBClient, START, excludeSystemEvents } from "@eventstore/db-client";
import { Readable, finished } from "stream";

export type SubscriptionResolvedEvent = AllStreamResolvedEvent & {
    subscriptionId: string;
  };

export type Checkpoint = { position: string };

export type EventHandler = (event: SubscriptionResolvedEvent) => Promise<void>;

// Loads current position or start and subscribes to all events except system events.
export const SubscriptionToAll =
  (
    eventStore: EventStoreDBClient,
    loadCheckpoint: (subscriptionId: string) => Promise<bigint | undefined>,
  ) =>
  async (subscriptionId: string, handlers: EventHandler[]) => {
    const currentPosition = await loadCheckpoint(subscriptionId);
    const fromPosition = !currentPosition
      ? START
      : { prepare: currentPosition, commit: currentPosition };

    const subscription = eventStore.subscribeToAll({
      fromPosition,
      filter: excludeSystemEvents(),
    });

    // Upon event notification, loop through handlers.
    finished(
      subscription.on('data', async (resolvedEvent: AllStreamResolvedEvent) => {
        for (const handler of handlers) {
          await handler({ ...resolvedEvent, subscriptionId });
        }
      }) as Readable,
      (error) => {
        if (!error) {
          console.info(`Stopping subscription.`);
          return;
        }
        console.error(`Received error: ${JSON.stringify(error)}.`);
      },
    );
    return subscription;
  };