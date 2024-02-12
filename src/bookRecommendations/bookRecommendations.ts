import { JSONEventType, ResolvedEvent, StreamingRead } from "@eventstore/db-client";
import { Book, addBookLike, addBookRating, addBookView, removeBookLike } from "./book";
import { StreamAggregator } from "../core/streams";

// Events

export type createRecommendation = JSONEventType<
    'create-recommendation',
    Readonly<{
        recommendationId: string;
        userId: string;
        createdAt: string;
    }>
>;

export type viewBook = JSONEventType<
    'view-book',
    Readonly<{
        userId: string;
        book: Book;
    }>
>;

export type rateBook = JSONEventType<
'rate-book',
Readonly<{
    userId: string;
    book: Book;
    rating: number;
}>
>;

export type likeBook = JSONEventType<
'like-book',
Readonly<{
    userId: string;
    book: Book;
}>
>;

export type unlikeBook = JSONEventType<
'unlike-book',
Readonly<{
    userId: string;
    book: Book;
}>
>;

export type BookRecommendationEvent = 
    | createRecommendation
    | viewBook
    | rateBook
    | likeBook
    | unlikeBook

// Entity/State

export interface BookRecommendation {
    id: string;
    userId: string;
    recommendFromViews: string[],
    recommendFromRatings: string[],
    recommendFromLikes: string[],
    createdAt: Date;
}

export const toBookRecommendationStreamName = (recommendationId: string) => 
    `recommendation-${recommendationId}`;

// Getting the state from events

export const getBookRecommendation = StreamAggregator<
    BookRecommendation,
    BookRecommendationEvent    
>((currentState, event) => {
    if (event.type === 'create-recommendation') {
        if(currentState != null) throw BookRecommendationErrors.CREATING_EXISTING_RECOMMENDATION;
        return {
            id: event.data.recommendationId,
            userId: event.data.userId,
            recommendFromViews: [],
            recommendFromRatings: [],
            recommendFromLikes: [],
            createdAt: new Date(event.data.createdAt),
        };
    }

    if (currentState == null) throw BookRecommendationErrors.RECOMMENDATION_NOT_FOUND;

    switch (event.type) {
        case 'view-book':
            return {
                ...currentState,
                recommendFromViews: addBookView(currentState.recommendFromViews, event.data.book.categories),
            };
        case 'rate-book':
            return {
                ...currentState,
                recommendFromRatings: addBookRating(currentState.recommendFromRatings, event.data.book, event.data.rating),
            };
        case 'like-book':
            return {
                ...currentState,
                recommendFromLikes: addBookLike(currentState.recommendFromLikes, event.data.book.categories),
            };
        case 'unlike-book':
            return {
                ...currentState,
                recommendFromLikes: removeBookLike(currentState.recommendFromLikes, event.data.book.categories),
            };
        default:
            const _: never = event;
            throw BookRecommendationErrors.UNKNOWN_EVENT_TYPE;
    }
});

export const enum BookRecommendationErrors {
    CREATING_EXISTING_RECOMMENDATION = 'CREATING_EXISTING_RECOMMENDATION',
    RECOMMENDATION_NOT_FOUND = 'RECOMMENDATION_NOT_FOUND',
    UNKNOWN_EVENT_TYPE = 'UNKNOWN_EVENT_TYPE',
};

export const isBookRecommendationEvent = (
    event: unknown,
): event is BookRecommendationEvent => {
    return (
        event != null &&
        ((event as BookRecommendationEvent).type == 'create-recommendation' ||
            (event as BookRecommendationEvent).type ===
                'view-book' ||
            (event as BookRecommendationEvent).type ===
                'like-book' ||
            (event as BookRecommendationEvent).type ===
                'rate-book' ||
            (event as BookRecommendationEvent).type === 'unlike-book')
    );
};

// Business Logic


// Create Recommendation
export type CreateRecommendation = {
    recommendationId: string;
    userId: string;
}

export const createRecommendation = ({
    recommendationId, userId
}: CreateRecommendation): createRecommendation => {
    return {
        type: 'create-recommendation',
        data: {
            recommendationId,
            userId,
            createdAt: new Date().toJSON(),
        },
    };
};


// Add Book View
export type AddBookView = {
    userId: string;
    book: Book;
}

export const addBookViewToRecommendation = async (
    events: StreamingRead<ResolvedEvent<BookRecommendationEvent>>,
    { userId, book }: AddBookView,
): Promise<viewBook> => {
    // const recommendation = await getBookRecommendation(events);

    return {
        type: 'view-book',
        data: {
            userId,
            book,
        }
    }
}

// Add Book Rating
export type AddBookRating = {
    userId: string;
    book: Book;
    rating: number;
}

export const addBookRatingToRecommendation = async (
    events: StreamingRead<ResolvedEvent<BookRecommendationEvent>>,
    { userId, book, rating }: AddBookRating,
): Promise<rateBook> => {
    // const recommendation = await getBookRecommendation(events);

    return {
        type: 'rate-book',
        data: {
            userId,
            book,
            rating
        },
    }
}

// Add Book Like
export type AddBookLike = {
    userId: string;
    book: Book;
}

export const addBookLikeToRecommendation = async (
    events: StreamingRead<ResolvedEvent<BookRecommendationEvent>>,
    { userId, book }: AddBookLike,
): Promise<likeBook> => {
    // const recommendation = await getBookRecommendation(events);

    return {
        type: 'like-book',
        data: {
            userId,
            book,
        }
    }
}

// Unlike Book
export type UnlikeBook = {
    userId: string;
    book: Book;
}

export const UnlikeBookForRecommendation = async (
    events: StreamingRead<ResolvedEvent<BookRecommendationEvent>>,
    { userId, book }: UnlikeBook,
): Promise<unlikeBook> => {
    // const recommendation = await getBookRecommendation(events);

    return {
        type: 'unlike-book',
        data: {
            userId,
            book,
        }
    }
}