const { app } = require('@azure/functions');
app.setup({ enableHttpStream: true });

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
require('dotenv').config();

const apiKey = process.env.AOAI_API_KEY;
const endpoint = process.env.AOAI_ENDPOINT;
const model = process.env.AOAI_MODEL;

const chatgpt_streamer = (response) => {
    return {
        [Symbol.asyncIterator]: async function* () {
            for await (const chunk of response) {
                const content = chunk?.choices[0]?.delta?.content;
                if (content) yield content;
            }
        }
    };
};

app.http('analyze', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'analyze',
    handler: async (request, context) => {

        try {

            data = await request.json()
            const messages_text = data.messages;
    
            const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

            //ChatGPTへの指示プロンプト
            const system_prompt = `\
あなたはMermaid flowchart記載のエキスパートです。
入力された情報をもとに、LR記述のFlowChartを作成します。
なお、作成する内容はValue Strem Mappingになります。
以下の情報をもとに、FlowChartを作成してください。回答はMermaid FlowChartのみです。
**説明や補足は不要です**

# ノードの記載方法(タスクの記載)
(ノードID)[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'>(課題マークをカンマ区切りで記載)</span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>(タスク名)</span>

    PT: (数字)&lpar;(単位時間: 週、日、時間、分など)&rpar;
    LT: (数字)&lpar;(単位時間: 週、日、時間、分など)&rpar;

    (作業担当者、もしくはチーム名)
]

# タスク記載の補足情報
PT: Process Time (実作業時間)
LT: Lead Time (前工程が終わってから、本行程が終わるまでの全体時間)
1日は8時間、1週間は40時間、1か月は160時間として計算してください。
なお、LT,PTが不明な場合は -- (時間)として記載してください。

# エッジの記載方法(タスク間の連続性)
同じ人物や同じチームが作業を続ける場合、もしくは違う人物や違うチームが作業を続けるという明記がない場合、
A --> B

違う人物や違うチームが作業を続ける場合
A -.-> B

# スクラップレートの記載方法
もしある作業Aの後行程作業Bを実施中に、Aに不具合や不備があり手戻りする場合、手戻り率を30%とすると以下のように記載してください。
A --> |S/R 30%| B

# 課題マークの意味
無駄の種類	マーク	定義	例
欠陥の無駄 (Defects)	D	誤った、抜けのある、不透明な情報や成果物。システムを破壊し、解決するのに時間と労力が必要	壊れたビルド、不正確な設定、不正確な要求
マニュアル / モーション (Manual / Motion, Handoffs)	M	オーバーヘッド、コーディネーション、作業引き渡し、もしくはセットアップや、仕事の実行に関する非効率性	ミーティング、手動デプロイ、チーム間の作業引き渡し
待ちの無駄 (Waiting)	W	次の価値のあるステップを開始、もしくは終了することの遅れ	承認待ち、リソースの待ち、予定されたミーティング待ち
未完了の作業 (Partially Done)	PD	未完了の作業、何らかの操作。他者からの入力やアクションが必要となる。欠陥とタスク切替、待ちを招く	デプロイされていないコード、不完全な環境設定、実行中バッチ
タスクの切り替え (Task Switching)	TS	タスクの切り替えは、高価なコンテキストスイッチを招き、エラーが発生しやすくなる	進捗上限による無駄作業、障害による中断、アドホックなリクエスト
余分なプロセス (Extra Process)	EP	価値のないステップやプロセス。大抵、公式、非公式な標準作業に含まれる	不要な承認、不要なドキュメント、無駄なレビュー
余分な機能 (Extra Feature)	EF	機能、たいていは実装フェーズで追加されたもの。リクエストされていない、ビジネスに沿っていない、顧客価値がない	“次に必要かもしれない”、不要なアップデートや要求、望んでいない
ヒーローまたはヒロイン (Heroics)	H	仕事を完了させる、もしくは顧客を満足させるために、ある人に大変な負荷がかかっている状態。ボトルネック	数日必要なデプロイ、長年の知識が必要、極端な調整が必要

# フェーズや工程の区切り
subgraph (フェーズ名)
    A-->B
    B-->C
end
C-->D
のように、行程やフェーズが明示されていればサブグラフを記載してください。

# VSMフローチャートのサンプル

graph LR
T001[
  <!-- 課題一覧, 作業名, 作業時間, トータル時間 -->
  <font color="red"></font>
  &nbsp; <u><b><font size=+1>要件定義</font></b></u> &nbsp;
  PT: 3.0&lpar;日&rpar;
  LT: 14.0&lpar;日&rpar;
]
T001[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>要件定義</span>

    PT: 3.0&lpar;日&rpar;
    LT: 14.0&lpar;日&rpar;
  
    企画部企画課
]

T002[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'>H</span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>設計</span>

    PT: 1.0&lpar;日&rpar;
    LT: 1.0&lpar;日&rpar;
  
    開発部 高橋さん
]

T003[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>実装・テスト</span>

    PT: 3.0&lpar;日&rpar;
    LT: 5.0&lpar;日&rpar;
  
    開発部開発課
]

T004[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'></span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>デプロイ</span>

    PT: 0.5&lpar;日&rpar;
    LT: 0.5&lpar;日&rpar;
  
    インフラチーム
]

T005[
    <!-- 課題一覧, 作業名, 作業時間, トータル時間, 作業担当 -->
    <span style='background-color: #fcc ; color: red ; font-weight:bold;'>M, H</span>
    <span style='font-size: 1.5em; font-weight:bold; margin:10px;'>リリース</span>

    PT: 1.5&lpar;時間&rpar;
    LT: 5.0&lpar;時間&rpar;
  
    インフラチーム
]

Start([Start])-->T001
T001-->T002
subgraph 開発工程
T002-.->T003
T003-->|S/R 50%|T004
end
T004-.->T005
T005-->End([EndUser])
`;
    

            const messages = [
                {role: "system", content: system_prompt},
                {role: "user", content: messages_text}
            ]

            const params = {
                temperature:0,
            }
    
            const event = await client.streamChatCompletions(model, messages, params);

            return { 
                body: chatgpt_streamer(event),
                headers: {
                    "Content-Type": "text/event-stream"
                }
            };
        } catch (error) {
            // Handle the error here
            context.log(error);
            return {
                status: 500,
                body: error.message
            };
        } finally {
            // Perform any cleanup or finalization tasks here
        }

    }
});