export interface Book {
    isbn: number;
    categories: string[];
}

// Obtains current state and modifies view recommendations with viewed book categories. 
export const addBookView = (
    recommendFromViews: string[], bookViewCategories: string[]) 
    : string[] => {
        const newRecommendFromViews = recommendFromViews;

        bookViewCategories.forEach((category) => {
            if (newRecommendFromViews.length == 10) {
                newRecommendFromViews.pop();
            }
            newRecommendFromViews.unshift(category);
        });
        return newRecommendFromViews;
}

// Obtains current state and modifies rating recommendations with rated book categories with a rating greater than 4. 
export const addBookRating = (
    recommendFromRatings: string[], book: Book, rating: number) 
    : string[] => {
        const newRecommendFromRatings = recommendFromRatings;

        if (rating >= 4 || newRecommendFromRatings.length == 0) {
            book.categories.forEach(category => {
                if (newRecommendFromRatings.length == 10) {
                    newRecommendFromRatings.pop();
                }
                newRecommendFromRatings.unshift(category)
            });
        }
        return newRecommendFromRatings;
}

// Obtains current state and modifies like recommendations with liked book categories. 
export const addBookLike = (
    recommendFromLikes: string[], bookLikeCategories: string[])
    : string[] => {
        const newRecommendFromLikes = recommendFromLikes;

        bookLikeCategories.forEach((category) => {
            if (newRecommendFromLikes.length == 10) {
                newRecommendFromLikes.pop();
            }
            newRecommendFromLikes.unshift(category);
        });
        return newRecommendFromLikes;
    }

// Obtains current state and modifies like recommendations with unliked book categories. 
export const removeBookLike = (
    recommendFromLikes: string[], bookLikeCategories: string[])
    : string[] => {
        const newRecommendFromLikes = recommendFromLikes;

        bookLikeCategories.forEach((category) => {
            const index = newRecommendFromLikes.indexOf(category);
            if (index > -1) {
                newRecommendFromLikes.splice(index, 1);
            }
        });
        return newRecommendFromLikes;
    }