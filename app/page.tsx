export default function Home() {
  return (
    <main className="launch-page">
      <section className="launch-card" aria-labelledby="page-title">
        <div className="launch-copy">
          <p className="product-label">口译工作与日程管理</p>
          <h1 id="page-title">口译小助理</h1>
          <p className="intro">在手机上快速记录，在电脑上整理统计。登录后，两端使用同一份数据。</p>

          <div className="launch-actions" aria-label="选择使用方式">
            <a className="primary-action" href="/mobile-schedule.html">打开手机版</a>
            <a className="secondary-action" href="/interpreter-schedule.html">打开桌面版</a>
          </div>

          <ul className="feature-list" aria-label="主要能力">
            <li>手机安装</li>
            <li>桌面整理</li>
            <li>云端同步</li>
          </ul>

          <p className="install-note">在华为手机的 Edge 中打开本站后，可从浏览器菜单添加到主屏幕。</p>
        </div>

        <div className="launch-art" aria-hidden="true">
          <div className="art-backdrop"></div>
          <img src="/assets/illustrations/home-calendar-sun.png" alt="" />
        </div>
      </section>
    </main>
  );
}
