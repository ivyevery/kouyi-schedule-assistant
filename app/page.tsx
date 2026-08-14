export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">译</span><span>口译小助理</span></div>
        <span className="header-note">为口译工作者设计</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">口译工作与日程管理</p>
          <h1 id="page-title">日程随手记，<br />工作<span className="headline-accent">回到一处</span>。</h1>
          <p className="intro">在手机上快速记录，在电脑上整理统计。登录后，两端使用同一份数据。</p>

          <nav className="launch-actions" aria-label="选择使用方式">
            <a className="launch-action primary-action" href="/mobile-schedule.html">
              <span className="action-title">打开手机版</span>
              <span className="action-detail">随时记录与查看日程</span>
            </a>
            <a className="launch-action" href="/interpreter-schedule.html">
              <span className="action-title">打开桌面版</span>
              <span className="action-detail">集中整理与统计工作</span>
            </a>
          </nav>

          <ul className="feature-line" aria-label="主要能力">
            <li><strong>记录</strong>快速添加日程</li>
            <li><strong>整理</strong>归档口译资料</li>
            <li><strong>同步</strong>跨设备接着用</li>
          </ul>
        </div>

        <div className="hero-visual">
          <img src="/assets/illustrations/home-calendar-sun.png" alt="微笑的太阳和日历插画" width="1024" height="1024" />
          <p className="install-note"><strong>像 App 一样使用</strong>华为手机用 Edge 打开后，可从浏览器菜单添加到主屏幕。</p>
        </div>
      </section>
    </main>
  );
}
