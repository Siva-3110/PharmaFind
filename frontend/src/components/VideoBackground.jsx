function VideoBackground() {
    return (
        <>
            <video
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(2px) brightness(0.65)',
                    zIndex: -2,
                }}
                autoPlay
                muted
                loop
                playsInline
            >
                <source src="/bg.mp4" type="video/mp4" />
            </video>

            {/* Stronger overlay so text is readable while video is still visible */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(0,10,40,0.65) 0%, rgba(0,20,50,0.55) 100%)',
                    zIndex: -1,
                }}
            />
        </>
    );
}

export default VideoBackground;
