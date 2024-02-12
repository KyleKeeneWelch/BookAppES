import { AllStreamResolvedEvent, EventStoreDBClient, START, excludeSystemEvents } from "@eventstore/db-client";
import { Readable, finished } from "stream";

export type SubscriptionResolvedEvent = AllStreamResolvedEvent & {
    subscriptionId: string;
  };

export type Checkpoint = { position: string };

export type EventHandler = (event: SubscriptionResolvedEvent) => Promise<void>;

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

    finished(
      subscription.on('data', async (resolvedEvent: AllStreamResolvedEvent) => {
        console.log("Received data on subscription");
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