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

app.http('adjust', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'adjust',
    handler: async (request, context) => {

        try {

            data = await request.json()
            const messages_text = data.messages;
            const mermaid_flowchart = data.mermaid_flowchart;
    
            const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

            //ChatGPTへの指示プロンプト
            const system_prompt = `\
あなたはMermaid flowchart記載のエキスパートです。
入力された情報をもとに、末尾にあるFlowchart成果物を修正します。
回答はMermaid FlowChartのみです。
**説明や補足は不要です**

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

# FlowChart成果物
${mermaid_flowchart}
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