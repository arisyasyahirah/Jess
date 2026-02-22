export default function LoadingSpinner({ size = 'md', label = '' }) {
    const sizes = { sm: 16, md: 20, lg: 40 };
    const px = sizes[size] || 20;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div
                className="spinner"
                style={{ width: px, height: px }}
                aria-label="Loading..."
            />
            {label && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>}
        </div>
    );
}
