import { AppendResult, EventStoreDBClient, JSONEventType, NO_STREAM, ResolvedEvent, StreamingRead, jsonEvent } from "@eventstore/db-client";

// Write Model Create Command
export const create =
  <Command, StreamEvent extends JSONEventType>(
    eventStore: EventStoreDBClient,
    handle: (command: Command) => StreamEvent,
  ) =>
  (streamName: string, command: Command): Promise<AppendResult> => {
    // Run handler.
    const event = handle(command);

    // Append handled event to stream.
    return eventStore.appendToStream(streamName, jsonEvent(event), {
      expectedRevision: NO_STREAM,
    });
  }; 

  // Write Model Update Command
export const update =
    <Command, StreamEvent extends JSONEventType>(
        eventStore: EventStoreDBClient,
        handle: (
            events: StreamingRead<ResolvedEvent<StreamEvent>>,
            command: Command,
        ) => Promise<StreamEvent>,
    ) =>
    async (
        streamName: string,
        command: Command,
        expectedRevision: bigint,
    ): Promise<AppendResult> => {
      // Read from the stream.
        const readStream = eventStore.readStream(streamName);

        // Run handler.
        const event = await handle(readStream, command);

        // Append handled event to stream with expected revision.
        const eventData = jsonEvent(event);
        return eventStore.appendToStream(streamName, eventData, {
            expectedRevision,
        });
};