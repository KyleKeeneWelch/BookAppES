import express, {
    NextFunction,
    Request,
    Response,
    Application,
    Router,
  } from 'express';
  import { v4 as uuid } from 'uuid';
import { UnlikeBookForRecommendation, addBookLikeToRecommendation, addBookRatingToRecommendation, addBookViewToRecommendation, createRecommendation, toBookRecommendationStreamName } from '../bookRecommendations/bookRecommendations';
import { getEventStore } from '../core/streams';
import { create, update } from '../core/commandHandling';
import { assertNotEmptyString, assertPositiveNumber } from '../core/validation';
import { getExpectedRevisionFromETag, sendCreated, toWeakETag } from '../core/http';
import { getBookRecommendationCollection } from './bookRecommendationDetails';
import passport from 'passport';

export const router = Router();

// Create Book Recommendation
router.post('/users/:userId/book-recommendation/', passport.authenticate("jwt", { session: false }), 
  async (request: Request, response: Response, next: NextFunction) => {
    try {
        if (!request.user) throw "NO DATA FROM JWT";

        const recommendationId = uuid();
        const streamName = toBookRecommendationStreamName(recommendationId);

        const result = await create(getEventStore(), createRecommendation)(
            streamName,
            {
                recommendationId,
                userId: assertNotEmptyString(request.params.userId),
            },
        );

        response.set('ETag', toWeakETag(result.nextExpectedRevision));
        sendCreated(response, recommendationId);
    } catch (error) {
        next(error);
    }
  }
)

// Add Book View

type AddBookViewRequest = Request<
  Partial<{ recommendationId: string; userId: string }>,
  unknown,
  { isbn: number; categories: string[] }
>;

router.post('/users/:userId/book-recommendation/:recommendationId/view-book', passport.authenticate("jwt", { session: false }), 
  async (
    request: AddBookViewRequest,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      if (request.user) {
        const bookRecommendations = await getBookRecommendationCollection();
        const user = await bookRecommendations.findOne({ userId: request.user.id });

        if (!user) throw "USER NOT FOUND";
      } else {
        throw "NO DATA FROM JWT";
      }

      const recommendationId = assertNotEmptyString(request.params.recommendationId);
      const streamName = toBookRecommendationStreamName(recommendationId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(
        getEventStore(),
        addBookViewToRecommendation,
      )(
        streamName,
        {
          userId: assertNotEmptyString(request.params.userId),
          book: {
            isbn: assertPositiveNumber(Number(request.body.isbn)),
            categories: request.body.categories,
          },
        },
        expectedRevision,
      );

      response.set('Etag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// Add Book Rating

type AddBookRatingRequest = Request<
  Partial<{ recommendationId: string; userId: string }>,
  unknown,
  { isbn: number; categories: string[], rating: number }
>;

router.post('/users/:userId/book-recommendation/:recommendationId/rate-book', passport.authenticate("jwt", { session: false }), 
  async (
    request: AddBookRatingRequest,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      if (request.user) {
        const bookRecommendations = await getBookRecommendationCollection();
        const user = await bookRecommendations.findOne({ userId: request.user.id });

        if (!user) throw "USER NOT FOUND";
      } else {
        throw "NO DATA FROM JWT";
      }

      const recommendationId = assertNotEmptyString(request.params.recommendationId);
      const streamName = toBookRecommendationStreamName(recommendationId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(
        getEventStore(),
        addBookRatingToRecommendation,
      )(
        streamName,
        {
          userId: assertNotEmptyString(request.params.userId),
          book: {
            isbn: assertPositiveNumber(Number(request.body.isbn)),
            categories: request.body.categories,
          },
          rating: request.body.rating,
        },
        expectedRevision,
      );

      response.set('Etag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// Add Book Like

type AddBookLikeRequest = Request<
  Partial<{ recommendationId: string; userId: string }>,
  unknown,
  { isbn: number; categories: string[] }
>;

router.post('/users/:userId/book-recommendation/:recommendationId/like-book', passport.authenticate("jwt", { session: false }), 
  async (
    request: AddBookLikeRequest,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      if (request.user) {
        const bookRecommendations = await getBookRecommendationCollection();
        const user = await bookRecommendations.findOne({ userId: request.user.id });

        if (!user) throw "USER NOT FOUND";
      } else {
        throw "NO DATA FROM JWT";
      }

      const recommendationId = assertNotEmptyString(request.params.recommendationId);
      const streamName = toBookRecommendationStreamName(recommendationId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(
        getEventStore(),
        addBookLikeToRecommendation,
      )(
        streamName,
        {
          userId: assertNotEmptyString(request.params.userId),
          book: {
            isbn: assertPositiveNumber(Number(request.body.isbn)),
            categories: request.body.categories,
          },
        },
        expectedRevision,
      );

      response.set('Etag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// Unlike Book

type UnlikeBookRequest = Request<
  Partial<{ recommendationId: string; userId: string }>,
  unknown,
  { isbn: number; categories: string[] }
>;

router.post('/users/:userId/book-recommendation/:recommendationId/unlike-book', passport.authenticate("jwt", { session: false }), 
  async (
    request: UnlikeBookRequest,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      if (request.user) {
        const bookRecommendations = await getBookRecommendationCollection();
        const user = await bookRecommendations.findOne({ userId: request.user.id });

        if (!user) throw "USER NOT FOUND";
      } else {
        throw "NO DATA FROM JWT";
      }

      const recommendationId = assertNotEmptyString(request.params.recommendationId);
      const streamName = toBookRecommendationStreamName(recommendationId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(
        getEventStore(),
        UnlikeBookForRecommendation,
      )(
        streamName,
        {
          userId: assertNotEmptyString(request.params.userId),
          book: {
            isbn: assertPositiveNumber(Number(request.body.isbn)),
            categories: request.body.categories,
          },
        },
        expectedRevision,
      );

      response.set('Etag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// Get Recommendation
router.get(
  '/users/:userId/book-recommendation/:recommendationId', passport.authenticate("jwt", { session: false }),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (request.user) {
        const bookRecommendations = await getBookRecommendationCollection();
        const user = await bookRecommendations.findOne({ userId: request.user.id });

        if (!user) throw "USER NOT FOUND";
      } else {
        throw "NO DATA FROM JWT";
      }
      const collection = await getBookRecommendationCollection();

      const result = await collection.findOne({
        userId: assertNotEmptyString(request.params.userId),
      });

      if (result === null) {
        response.sendStatus(404);
        return;
      }

      response.set('ETag', toWeakETag(result.revision));
      response.send(result);
    } catch (error) {
      next(error);
    }
  },
);