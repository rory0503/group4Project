import { useState } from "react";

function StarIcon({ filled, size = 22 }) {
    return (
        <svg
            className={`star-icon${filled ? " star-icon--filled" : ""}`}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
        </svg>
    );
}

function FavouriteModel({ user }) {
    const models = user?.favouriteModels ?? [];

    // Tracks which models are currently starred (all start starred unless isFavourite === false)
    const [starred, setStarred] = useState(
        () => new Set(models.filter((m) => m.isFavourite !== false).map((m) => m.id))
    );

    const toggleStar = (id) => {
        setStarred((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    return (
        <div className="favourites">
            <div className="favourites-heading-row">
                <StarIcon filled={false} size={32} />
                <h3 className="favourites-heading">Favourite Models</h3>
            </div>
            <p className="favourites-subheading">
                Your selected models will appear first in your dashboard and comparisons.
            </p>

            <div className="favourites-list">
                {models.length === 0 ? (
                    <p className="favourites-empty">No favourite models yet.</p>
                ) : (
                    models.map((model) => {
                        const isStarred = starred.has(model.id);
                        return (
                            <div className="model-card" key={model.id}>
                                <img
                                    className="model-card__icon"
                                    src={model.icon}
                                    alt={`${model.company} logo`}
                                />
                                <div className="model-card__text">
                                    <p className="model-card__name">{model.name}</p>
                                    <p className="model-card__company">{model.company}</p>
                                </div>
                                <button
                                    type="button"
                                    className="star-button"
                                    onClick={() => toggleStar(model.id)}
                                    aria-pressed={isStarred}
                                    aria-label={`${isStarred ? "Unfavourite" : "Favourite"} ${model.name}`}
                                >
                                    <StarIcon filled={isStarred} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default FavouriteModel;