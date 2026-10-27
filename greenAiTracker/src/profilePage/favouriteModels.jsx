import { useState } from "react";

const colors = {
    text: "#0f3d2e",
    cardBg: "#f0f6ee",
    border: "#7ca982",
    star: "#164a38",
};

const styles = {
    card: {
        boxSizing: "border-box",
        width: "100%",              // CHANGED: was 460, now fills its grid column
        minHeight: 500,
        padding: "15px 21px 21px",
        background: colors.cardBg,
        border: `2px solid ${colors.border}`,
        borderRadius: 10,
        fontFamily: "'Inter', sans-serif",
        color: colors.text,
    },
    headingRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    heading: {
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        color: colors.text,
    },
    subheading: {
        margin: "6px 0 0",
        fontSize: 12,
        fontWeight: 600,
        color: colors.text,
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: 15,
        marginTop: 30,
    },
    modelCard: {
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 14,
        height: 78,
        padding: "0 14px",
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
    },
    modelIcon: {
        width: 55,
        height: 50,
        objectFit: "cover",
        borderRadius: 10,
        flexShrink: 0,
    },
    modelText: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    modelName: {
        margin: 0,
        fontSize: 14,
        fontWeight: 600,
        color: colors.text,
    },
    modelCompany: {
        margin: 0,
        fontSize: 12,
        fontWeight: 600,
        color: colors.text,
    },
    starButton: {
        display: "flex",
        padding: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
    },
    empty: {
        margin: 0,
        fontSize: 12,
        fontWeight: 600,
    },
};

function StarIcon({ filled, size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z"
                fill={filled ? colors.star : "none"}
                stroke={colors.star}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
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
        <div style={styles.card}>
            <div style={styles.headingRow}>
                <StarIcon filled={false} size={32} />
                <h3 style={styles.heading}>Favourite Models</h3>
            </div>
            <p style={styles.subheading}>
                Your selected models will appear first in your dashboard and comparisons.
            </p>

            <div style={styles.list}>
                {models.length === 0 ? (
                    <p style={styles.empty}>No favourite models yet.</p>
                ) : (
                    models.map((model) => {
                        const isStarred = starred.has(model.id);
                        return (
                            <div style={styles.modelCard} key={model.id}>
                                <img
                                    style={styles.modelIcon}
                                    src={model.icon}
                                    alt={`${model.company} logo`}
                                />
                                <div style={styles.modelText}>
                                    <p style={styles.modelName}>{model.name}</p>
                                    <p style={styles.modelCompany}>{model.company}</p>
                                </div>
                                <button
                                    type="button"
                                    style={styles.starButton}
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