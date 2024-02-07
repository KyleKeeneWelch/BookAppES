import { JSONEventType } from "@eventstore/db-client";
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