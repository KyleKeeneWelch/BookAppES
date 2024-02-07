import { EventStoreDBClient, jsonEvent } from "@eventstore/db-client";
import { BookRecommendationEvent, getBookRecommendation, toBookRecommendationStreamName } from "./bookRecommendations/bookRecommendations";
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    const userId = 'testuser';
    const bookRecommendationId = uuid();

    const events: BookRecommendationEvent[] = [
        {
            type: 'create-recommendation',
            data: {
                recommendationId: bookRecommendationId,
                userId: userId,
                createdAt: new Date().toJSON(),
            },
        },
        {
            type: 'view-book',
            data: {
                userId: userId,
                book: {
                    isbn: 2736277890012,
                    categories: ['action', 'adventure', 'comedy'],
                }
            }
        },
        {
            type: 'view-book',
            data: {
                userId: userId,
                book: {
                    isbn: 8765420989322,
                    categories: ['horror', 'thriller', 'action'],
                }
            }
        },
        {
            type: 'view-book',
            data: {
                userId: userId,
                book: {
                    isbn: 9862234347582,
                    categories: ['test1', 'test2', 'test3', 'test4', 'test5'],
                }
            }
        },
        {
            type: 'rate-book',
            data: {
                userId: userId,
                book: {
                    isbn: 9522210934375,
                    categories: ['thriller', 'fiction'],
                },
                rating: 5,
            }
        },
        {
            type: 'rate-book',
            data: {
                userId: userId,
                book: {
                    isbn: 9995654927374,
                    categories: ['non-fiction'],
                },
                rating: 2,
            }
        },
        {
            type: 'rate-book',
            data: {
                userId: userId,
                book: {
                    isbn: 8988872103223,
                    categories: ['fantasy', 'fiction'],
                },
                rating: 4.5,
            }
        },
        {
            type: 'like-book',
            data: {
                userId: userId,
                book: {
                    isbn: 1272289856343,
                    categories: ['horror', 'thriller', 'action'],
                }
            }
        },
        {
            type: 'unlike-book',
            data: {
                userId: userId,
                book: {
                    isbn: 9991177263678,
                    categories: ['horror', 'thriller', 'test1', 'test2'],
                }
            }
        },
    ];

    const streamName = toBookRecommendationStreamName(bookRecommendationId);

    const eventStore = EventStoreDBClient.connectionString(process.env.ESDB_CONNECTION_STRING || '');

    await eventStore.appendToStream<BookRecommendationEvent>(
        streamName,
        events.map((e) => jsonEvent<BookRecommendationEvent>(e))
    );

    const bookRecommendationStream = eventStore.readStream<BookRecommendationEvent>(streamName);

    const bookRecommendation = await getBookRecommendation(bookRecommendationStream);

    console.log(bookRecommendation);
})();