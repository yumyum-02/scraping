const puppeteer = require('puppeteer');
const fs = require('fs');

// コマンドライン引数からURLを取得
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.log('使用方法: node crowl.js <サイトURL>');
  console.log('例: node crowl.js https://example.com');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 結果を格納する配列
  const results = [];
  
  try {
    // 指定されたURLにアクセス
    console.log(`クローリング開始: ${targetUrl}`);
    await page.goto(targetUrl);
    
    // メインページのタイトルを取得
    const mainTitle = await page.title();
    console.log('メインページタイトル:', mainTitle);
    
    // メインページの結果を追加
    results.push({
      url: targetUrl,
      title: mainTitle,
      type: 'メインページ'
    });
    
    // ドメインを抽出（フィルタリング用）
    const domain = new URL(targetUrl).hostname;
    console.log(`対象ドメイン: ${domain}`);
    
    // ページ内のリンクを取得
    const links = await page.evaluate((targetDomain) => {
      const anchors = document.querySelectorAll('a[href]');
      const urls = [];
      
      anchors.forEach(anchor => {
        const href = anchor.href;
        try {
          const url = new URL(href);
          // 同じドメインのリンクのみを取得
          if (url.hostname === targetDomain && href !== window.location.href) {
            urls.push(href);
          }
        } catch (e) {
          // 無効なURLは無視
        }
      });
      
      // 重複を除去
      return [...new Set(urls)];
    }, domain);
    
    console.log(`\n見つかったリンク数: ${links.length}`);
    
    // 各リンクのページタイトルを取得
    console.log('\n=== 各ページのタイトル ===');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`\n${i + 1}/${links.length}: ${link}`);
      
      try {
        // 新しいページでリンクにアクセス
        const newPage = await browser.newPage();
        await newPage.goto(link, { 
          waitUntil: 'networkidle2', 
          timeout: 10000 
        });
        
        // ページタイトルを取得
        const title = await newPage.title();
        console.log(`タイトル: ${title}`);
        
        // 結果を配列に追加
        results.push({
          url: link,
          title: title,
          type: '下層ページ'
        });
        
        // ページを閉じる
        await newPage.close();
        
        // サーバーに負荷をかけないよう少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`エラー: ${error.message}`);
        // エラーの場合も結果に追加
        results.push({
          url: link,
          title: `エラー: ${error.message}`,
          type: 'エラー'
        });
      }
    }
    
    // CSVファイルに結果を保存
    await saveToCSV(results);
    
    console.log('\n=== クローリング完了 ===');
    console.log(`結果をCSVファイルに保存しました: crawl_results.csv`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  } finally {
    await browser.close();
  }
})();

// CSVファイルに保存する関数
async function saveToCSV(data) {
  // CSVヘッダー
  let csvContent = 'URL,タイトル,ページタイプ\n';
  
  // データをCSV形式に変換
  data.forEach(item => {
    // カンマや改行を含む文字列をエスケープ
    const escapedTitle = `"${item.title.replace(/"/g, '""')}"`;
    const escapedUrl = `"${item.url}"`;
    const escapedType = `"${item.type}"`;
    
    csvContent += `${escapedUrl},${escapedTitle},${escapedType}\n`;
  });
  
  // ファイルに保存
  fs.writeFileSync('crawl_results.csv', csvContent, 'utf8');
}