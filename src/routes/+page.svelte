<script>
  import mermaid from 'mermaid';
  let displaySvg;
  let diagram = '';
  let displayAnswerWidthChange = 0;

  let messageInput = '';
  let messages = [];
  let answer = '';

  const design_header = `\
%%{
    init: {
        'theme': 'base',
        'themeVariables': {
        'primaryColor': '#fff',
        'primaryTextColor': '#000',
        'primaryBorderColor': '#666',
        'lineColor': '#000',
        'secondaryColor': '#fcc',
        'secondaryTextColor' : '#999',
        'tertiaryColor': '#fff',
        'tertiaryBorderColor': '#99f',
        'tertiaryTextColor': '#33f'
        }
    }
}%%

`

  const design_footer = `\

%% Link Color %%
linkStyle 1 color:red;
`


  let test_text = `\
まずはマーケットチームが調査をします。調査には3か月かかりますが、実際の作業時間は50時間くらいです。
次に企画部門が要件定義を実施します。1か月かかりますが、実際の作業時間は30時間くらいです。
その後開発部門が引き継ぎ、設計をします。設計は3週間です。実際の作業時間は40時間です。
そして実装です。実装は1か月です。実際の作業時間は100時間です。
その後運用部門でテストを実施します。テストは3か月かけますが、実際の稼働時間は10日程度です。
ここでよく問題が発生し、開発部門に再修正を依頼することが多いです。だいたい2回に1回くらいですかね。
テストが合格したらリリース作業をします。リリースは自動化されているので1日で終わります。リリース中に暇はないですね。
  `

  let sample_diagram = `\
graph LR
T001[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>マーケット調査</span>

    PT: 50.0&lpar;時間&rpar;
    LT: 3.0&lpar;月&rpar;

    マーケットチーム
]

T002[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>要件定義</span>

    PT: 30.0&lpar;時間&rpar;
    LT: 1.0&lpar;月&rpar;

    企画部門
]

T003[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>設計</span>

    PT: 40.0&lpar;時間&rpar;
    LT: 3.0&lpar;週間&rpar;

    開発部門
]

T004[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>実装</span>

    PT: 100.0&lpar;時間&rpar;
    LT: 1.0&lpar;月&rpar;

    開発部門
]

T005[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>テスト</span>

    PT: 80.0&lpar;時間&rpar;
    LT: 3.0&lpar;月&rpar;

    運用部門
]

T006[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'>M</span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>リリース</span>

    PT: 8.0&lpar;時間&rpar;
    LT: 1.0&lpar;日&rpar;

    運用部門
]
  
Start([Start])-->T001
T001-.->T002
T002-.->T003
subgraph 開発工程
T003-->T004
T004-.->|S/R 50%|T005
end
T005-->T006
T006-->End([EndUser])
`

  function removeBackticksFromFirstAndLastLine(answer) {
    let lines = answer.split('\n');
    if (lines[0].startsWith('```')) {
        lines = lines.slice(1);
    }
    if (lines[lines.length - 1].startsWith('```')) {
        lines = lines.slice(0, -1);
    }
    return lines.join('\n');
  }

  async function renderDiagram () {

    diagram = removeBackticksFromFirstAndLastLine(answer);

    const render_diagram = design_header + diagram + design_footer;

    const {svg} = await mermaid.render('mermaid', render_diagram)
    displaySvg = svg;
  }

  function downloadSVG() {
    const svgWithXMLDeclaration = `<?xml version="1.0" encoding="UTF-8"?>\n${displaySvg.replace(/&nbsp;/g, ' ').replace(/<br>/g, '<br/>').replace(/<hr>/g, '<hr/>')}`;    const blob = new Blob([svgWithXMLDeclaration], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diagram.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function analyzeMessages() {

    let response;
    // messagesが1の場合
    if (true) {
      response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: messages.join('\n') })
      });
    }else{

      // Mermaidの修正用のメソッド（いったんコメントアウト）
      const sendMesaages = messages.slice(1);

      response = await fetch('/api/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: sendMesaages.join('\n'), mermaid_flowchart: diagram })
      });
    }


    if (response.body) {
      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let output = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          renderDiagram();
          break;
        }
        output += decoder.decode(value);
        answer = output;
      }
    }
  }

  function sendMessage() {
    if (messageInput.trim() !== '') {
      messages = [...messages, messageInput.trim()];
      messageInput = '';
      analyzeMessages();
    }
  }

  function deleteMessage(index) {
    messages.splice(index, 1);
    messages = messages;
    analyzeMessages();
  }

  function doTest() {
    messageInput = test_text;
    messages = [...messages, messageInput.trim()];
    messageInput = '';
    answer = sample_diagram;
    renderDiagram();
  }

  function reRenderDiagram(){
    renderDiagram();
  }

</script>

<div class="board">
<div class="areaA">
  <textarea class="messageInput" bind:value={messageInput}></textarea>
  <button class="sendButton" on:click={sendMessage}>送信</button>
  <button class="sendButton" on:click={doTest}>テスト</button>
  <div class="messageList">
    {#each [...messages].reverse() as message, index}
      <div class="messageItem">
        {message}
        <button class="deleteButton" on:click={() => deleteMessage(messages.length - 1 - index)}>削除</button>
      </div>
    {/each}
  </div>
</div>

<div class="areaBC">
  <div class="areaB">
    <textarea class="editableAnswer" bind:value={answer} />
    <button class="sendButton" on:click={reRenderDiagram}>SVGのみ生成しなおす</button>
  </div>

  <div class="areaC">
    {#if displaySvg}
    <button class="downloadButton" on:click={()=>downloadSVG()}>SVGダウンロード</button>
    <input type="range" min="-3000" max="3000" bind:value={displayAnswerWidthChange} />
    {displayAnswerWidthChange}
    <div class="displayAnswer" style={`width: calc(100% + ${displayAnswerWidthChange}px);`}>
          {@html displaySvg}
    </div>
    {/if}
  </div>
  </div>
</div>

<style>
  :global(body) {
    font-family: 'Noto Sans JP', sans-serif;
  }

  .board {
    display: flex;
    flex-direction: row;
  }

  .areaA {
    width:500px;
    height: calc(100vh - 30px);
  }

  .areaBC {
    width: 100%;
    height: calc(100vh - 30px);
  }

  .messageInput {
    width: 485px;
    height: 200px;
    border-radius: 11px;
    padding:5px;
    border: 2px solid #666;
    font-family: 'Noto Sans JP', sans-serif;
  }

  .sendButton {
    width: 100%;
    border-radius: 8px;
    background-color: #669;
    color: white;
    font-size: 1.2em;
    margin-bottom:5px;
  }

  .sendButton:hover {
    background-color: #99c;
  }

  .messageList {
    margin-top: 50px;
  }

  .messageItem {
    width: calc(100% - 50px);
    border: 1px solid #336;
    padding: 20px;
    margin: 5px auto;
    border-radius: 8px;
  }

  .deleteButton {
    float: right;
    border-radius: 8px;
  }

  .areaB {
    width: calc(100% - 20px);
    height: 300px;
    margin:0px 10px;
  }

  .editableAnswer {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    font-family: 'Noto Sans JP', sans-serif;
  }

  .areaC {
    width: calc(100% - 20px);
    height: calc(100vh - 350px);
    margin:0px 10px;
  }

  
  .downloadButton {
    border-radius: 8px;
    background-color: #778;
    color: white;
    font-size: 1.0em;
    margin-top:50px;
  }

  .displayAnswer {
    width:100%;
    max-width: 3000px;
    height: calc(100% - 50px);
    text-align: left;
    margin-top:50px;
  }
</style>