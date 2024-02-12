import { getMongoCollection, retryIfNotFound, retryIfNotUpdated, toObjectId } from "../core/mongoDB";
import { SubscriptionResolvedEvent } from "#core/subscriptions";
import { addBookLike, addBookRating, addBookView, removeBookLike } from "./book";
import { createRecommendation, isBookRecommendationEvent, likeBook, rateBook, unlikeBook, viewBook } from "./bookRecommendations";

type BookRecommendationDetails = Readonly<{
    recommendationId: string;
    userId: string;
    recommendFromViews: string[];
    recommendFromRatings: string[];
    recommendFromLikes: string[];
    createdAt: string;
    revision: number;

}>;

export const getBookRecommendationCollection = () =>
    getMongoCollection<BookRecommendationDetails>('bookRecommendationDetails');

export const projectToBookRecommendation = (
        resolvedEvent: SubscriptionResolvedEvent,
    ): Promise<void> => {
        if (
            resolvedEvent.event === undefined ||
            !isBookRecommendationEvent(resolvedEvent.event)
        )
            return Promise.resolve();

        const { event } = resolvedEvent;
        const streamRevision = Number(event.revision);

        switch (event.type) {
            case 'create-recommendation':
                return projectCreateRecommendation(event, streamRevision);
            case 'view-book':
                return projectViewBook(event, streamRevision);
            case 'like-book':
                return projectLikeBook(event, streamRevision);
            case 'rate-book':
                return projectRateBook(event, streamRevision);
            case 'unlike-book':
                return projectUnlikeBook(event, streamRevision);
        }
};

export const projectCreateRecommendation = async (
    event: createRecommendation,
    streamRevision: number,
): Promise<void> => {
    const bookRecommendations = await getBookRecommendationCollection();

    await bookRecommendations.insertOne({
        _id: toObjectId(event.data.recommendationId),
        recommendationId: event.data.recommendationId,
        userId: event.data.userId,
        recommendFromViews: [],
        recommendFromRatings: [],
        recommendFromLikes: [],
        revision: streamRevision,
        createdAt: event.data.createdAt,
    });
};

export const projectViewBook = async (
    event: viewBook,
    streamRevision: number,
): Promise<void> => {
    const bookRecommendations = await getBookRecommendationCollection();
    const lastRevision = streamRevision - 1;

    // If this doesn't work, remember viewBook only has userId and so search by userId. A user should only have one recommendation stream so should be okay.
    const { recommendFromViews, revision } = await retryIfNotFound(() =>
        bookRecommendations.findOne(
            {
                userId: event.data.userId,
                revision: { $gte: lastRevision },
            },
            {
                projection: { recommendFromViews: 1, revision: 1 },
            },
        ),
    );

    if (revision > lastRevision) {
        return;
    }

    await retryIfNotUpdated(() => 
        bookRecommendations.updateOne(
            {
                userId: event.data.userId,
                revision: lastRevision,
            },
            {
                $set: {
                    recommendFromViews: addBookView(recommendFromViews, event.data.book.categories),
                    revision: streamRevision,
                },
            },
            { upsert: false },
        ),
    );
};

export const projectLikeBook = async (
    event: likeBook,
    streamRevision: number,
): Promise<void> => {
    const bookRecommendations = await getBookRecommendationCollection();
    const lastRevision = streamRevision - 1;

    const { recommendFromLikes, revision } = await retryIfNotFound(() =>
        bookRecommendations.findOne(
            {
                userId: event.data.userId,
                revision: { $gte: lastRevision },
            },
            {
                projection: { recommendFromLikes: 1, revision: 1 },
            },
        ),
    );

    if (revision > lastRevision) {
        return;
    }

    await retryIfNotUpdated(() => 
        bookRecommendations.updateOne(
            {
                userId: event.data.userId,
                revision: lastRevision,
            },
            {
                $set: {
                    recommendFromLikes: addBookLike(recommendFromLikes, event.data.book.categories),
                    revision: streamRevision,
                },
            },
            { upsert: false },
        ),
    );
};

export const projectRateBook = async (
    event: rateBook,
    streamRevision: number,
): Promise<void> => {
    const bookRecommendations = await getBookRecommendationCollection();
    const lastRevision = streamRevision - 1;

    const { recommendFromRatings, revision } = await retryIfNotFound(() =>
        bookRecommendations.findOne(
            {
                userId: event.data.userId,
                revision: { $gte: lastRevision },
            },
            {
                projection: { recommendFromRatings: 1, revision: 1 },
            },
        ),
    );

    if (revision > lastRevision) {
        return;
    }

    await retryIfNotUpdated(() => 
        bookRecommendations.updateOne(
            {
                userId: event.data.userId,
                revision: lastRevision,
            },
            {
                $set: {
                    recommendFromRatings: addBookRating(recommendFromRatings, event.data.book, event.data.rating),
                    revision: streamRevision,
                },
            },
            { upsert: false },
        ),
    );
};

export const projectUnlikeBook = async (
    event: unlikeBook,
    streamRevision: number,
): Promise<void> => {
    const bookRecommendations = await getBookRecommendationCollection();
    const lastRevision = streamRevision - 1;

    const { recommendFromLikes, revision } = await retryIfNotFound(() =>
        bookRecommendations.findOne(
            {
                userId: event.data.userId,
                revision: { $gte: lastRevision },
            },
            {
                projection: { recommendFromLikes: 1, revision: 1 },
            },
        ),
    );

    if (revision > lastRevision) {
        return;
    }

    await retryIfNotUpdated(() => 
        bookRecommendations.updateOne(
            {
                userId: event.data.userId,
                revision: lastRevision,
            },
            {
                $set: {
                    recommendFromLikes: removeBookLike(recommendFromLikes, event.data.book.categories),
                    revision: streamRevision,
                },
            },
            { upsert: false },
        ),
    );
};