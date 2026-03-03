import React from 'react';

const MaintenancePage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(circle at top, #ffecd2 0, #ffa751 40%, #d4145a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        boxSizing: 'border-box',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div
        className="ios-card"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: '32px 24px 28px',
          borderRadius: 24,
          background: 'rgba(0,0,0,0.4)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🧧</div>
        <h1
          style={{
            margin: '0 0 12px',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          Festickers 小憩中
        </h1>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 15,
            opacity: 0.9,
          }}
        >
          服务器当前暂时关闭，春节祝福墙在节日季会重新开启。
        </p>
        <p
          className="bilingual-en"
          style={{
            margin: '0 0 20px',
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          Our festive wall is taking a break. We&apos;ll be back for the next festival season.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            opacity: 0.75,
            lineHeight: 1.6,
          }}
        >
          你仍然可以收藏本页面或分享链接，节日重新开启后，就能再次和亲友互送贴纸祝福啦。
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;

