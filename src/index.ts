import { startAPI } from './core/api';
import {
  SubscriptionToAllWithMongoCheckpoints,
  storeCheckpointInCollection,
} from './core/mongoDB';
import { router } from './bookRecommendations/routes';
import { projectToBookRecommendation } from './bookRecommendations/bookRecommendationDetails';

/// API

startAPI(router);

/// Run

(async () => {
  await SubscriptionToAllWithMongoCheckpoints('sub_book_recommendations', [
    storeCheckpointInCollection(projectToBookRecommendation),
  ]);
})().catch(console.log);