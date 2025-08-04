import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time

def crawl_page(url, visited=None, max_depth=2, current_depth=0):
    """
    指定されたURLとその下層ページをクロールする関数
    
    Args:
        url: クロールするURL
        visited: 既に訪問したURLのセット
        max_depth: 最大クロール深度
        current_depth: 現在の深度
    """
    if visited is None:
        visited = set()
    
    # 既に訪問済みまたは最大深度に達した場合は終了
    if url in visited or current_depth >= max_depth:
        return
    
    # 同じドメインのURLかチェック
    base_domain = urlparse(url).netloc
    if urlparse(url).netloc != base_domain:
        return
    
    visited.add(url)
    
    try:
        print(f"\n{'='*50}")
        print(f"クロール中: {url} (深度: {current_depth})")
        print(f"{'='*50}")
        
        # ページの取得
        response = requests.get(url, timeout=10)
        response.encoding = response.apparent_encoding
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # タイトルの取得
        title = soup.find('title')
        if title:
            print(f"タイトル: {title.get_text().strip()}")
        
        # h1タグの取得
        h1_tags = soup.find_all('h1')
        if h1_tags:
            print(f"h1タグ ({len(h1_tags)}個):")
            for i, h1 in enumerate(h1_tags, 1):
                print(f"  {i}. {h1.get_text().strip()}")
        
        # h2タグの取得
        h2_tags = soup.find_all('h2')
        if h2_tags:
            print(f"h2タグ ({len(h2_tags)}個):")
            for i, h2 in enumerate(h2_tags, 1):
                print(f"  {i}. {h2.get_text().strip()}")
        
        # 次の深度でクロールするリンクを取得
        if current_depth < max_depth - 1:
            links = soup.find_all('a', href=True)
            for link in links:
                href = link['href']
                full_url = urljoin(url, href)
                
                # 同じドメインのリンクのみ処理
                if urlparse(full_url).netloc == base_domain:
                    crawl_page(full_url, visited, max_depth, current_depth + 1)
        
        # クロール間隔を設ける（サーバーに負荷をかけないため）
        time.sleep(1)
        
    except Exception as e:
        print(f"エラーが発生しました: {url} - {str(e)}")

# メイン処理
if __name__ == "__main__":
    url = "https://befriend.co.jp/"
    print("クローリングを開始します...")
    crawl_page(url, max_depth=2)  # 最大深度2までクロール
    print("\nクローリングが完了しました。")