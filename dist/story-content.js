// Fictional campaign narrative from the uploaded AERO ECHO story pack.
// Locale strings stay separate from combat configuration and save identifiers.
const text = (zh, ja, en) => ({ zh, ja, en });
const line = (speaker, zh, ja, en) => ({ speaker, text: text(zh, ja, en) });

export const PILOT_TEXT = [
  {
    id: 'cosmian', shipId: 'Dawn7',
    name: text('宇宙人', '宇宙人', 'Cosmian'),
    role: text('突击队长 · 曙光-7', '突撃隊長 · ドーン7', 'Strike Leader · Dawn-7'),
    bio: text(
      '为拯救地球率队突入 X 星。相信真正的胜利，是让被夺走选择权的人重新决定自己的未来。',
      '地球を救うため、仲間とともにX星へ突入する。選択を奪われた人々が未来を決められることこそ、真の勝利だと信じる。',
      'Leads the mission to save Earth. For Cosmian, victory means giving people the freedom to choose their own future.'
    )
  },
  {
    id: 'takeuchi', shipId: 'Bastion3',
    name: text('竹内瑞树', '竹内瑞樹', 'Mizuki Takeuchi'),
    role: text('战术守护者 · 堡垒-3', '戦術の守護者 · バスティオン3', 'Tactical Defender · Bastion-3'),
    bio: text(
      '以重装战机守护队友，负责解析敌方控制网络。他宁愿承受炮火，也不让任何同伴被留在身后。',
      '重装戦闘機で仲間を守り、敵の制御網を解析する。砲火を引き受けても、誰一人取り残さない。',
      'Protects the squad and deciphers enemy control networks. Takeuchi will face the fire before leaving a teammate behind.'
    )
  },
  {
    id: 'ikebukuro', shipId: 'WraithX',
    name: text('池袋敏博', '池袋敏博', 'Toshihiro Ikebukuro'),
    role: text('相位先锋 · 幽蓝-X', '位相の先駆者 · レイスX', 'Phase Vanguard · Wraith-X'),
    bio: text(
      '穿行于弹幕与空间裂隙之间，负责侦察与突围。敏锐的直觉总能从敌人的谎言中找到通向真相的缝隙。',
      '弾幕と空間の裂け目を抜け、偵察と突破を担う。鋭い直感で、敵の嘘に隠された真実への道を見つける。',
      'Scouts through barrages and spatial fractures. Ikebukuro trusts his instincts to find a way through the enemy’s deceptions.'
    )
  }
];

export const STORY_UI = {
  storyModal: text('任务剧情', '任務ストーリー', 'Mission Story'),
  opening: text('序章 · 突入 X 星', '序章 · X星へ', 'Prologue · Into Planet X'),
  chapterIntro: text('章节开始', 'チャプター開始', 'Chapter Briefing'),
  bossArrival: text('首领登场', 'ボス登場', 'Boss Arrival'),
  victory: text('战后通讯', '戦闘後の通信', 'After the Battle'),
  ending: text('最终章 · 黎明之后', '最終章 · 夜明けの後に', 'Final Chapter · After the Dawn'),
  next: text('继续', '続ける', 'Continue'),
  skip: text('跳过剧情', 'ストーリーをスキップ', 'Skip Story'),
  replay: text('重温剧情', 'ストーリーを再生', 'Replay Story'),
  storyArchive: text('剧情档案', 'ストーリー記録', 'Story Archive'),
  gallery: text('素材画廊', 'アートギャラリー', 'Art Gallery'),
  pilot: text('飞行员', 'パイロット', 'Pilot'),
  leader: text('关卡首领', 'チャプターのボス', 'Chapter Leader'),
  back: text('返回', '戻る', 'Back'),
  conceptArt: text('概念美术', 'コンセプトアート', 'Concept Art')
};

export const STORY = {
  prologue: {
    title: text('裂空回响 · 突入 X 星', '裂空回響 · X星への突入', 'AERO ECHO · Into Planet X'),
    text: text(
      'X 星的入侵舰队即将向地球出发。宇宙人、竹内瑞树与池袋敏博驾驶三架战机穿越封锁，深入九位首领统治的区域。一次营救地球的突击，将揭开超级系统 ECHO-0 对两个世界的威胁。',
      'X星の侵攻艦隊が地球へ向かおうとしていた。宇宙人、竹内瑞樹、池袋敏博は三機の戦闘機で封鎖を突破し、九人の首領が支配する領域へ進む。地球を救うための突撃は、二つの世界を脅かす超システムECHO-0の真実へとつながる。',
      'Planet X is preparing to launch its invasion of Earth. Cosmian, Mizuki Takeuchi, and Toshihiro Ikebukuro break through the blockade in three fighters. Their mission to stop nine leaders will reveal ECHO-0, a system threatening the freedom of both worlds.'
    ),
    lines: [
      line('cosmian',
        '地球在我们身后。先突破静默海岸，再逐一切断九位首领的控制链，不能让舰队离开 X 星。',
        '地球は俺たちの背後にある。静默海岸を突破し、九人の制御網を断つ。艦隊をX星から出すな。',
        'Earth is behind us. Break through the coast and sever the nine leaders’ control chain. That fleet cannot leave Planet X.'),
      line('takeuchi',
        '三机通讯已同步。我负责防护与解码；无论前面是什么，都保持联系，三个人一起回来。',
        '三機の通信を同期した。防御と解読は任せてくれ。何が待っていても、連絡を保ち、三人で帰ろう。',
        'Our comms are linked. I will handle defense and decryption. Stay in contact, whatever lies ahead. All three of us come home.'),
      line('ikebukuro',
        '敌方信号里藏着另一种声音，像有人正在求救。我去探路，也许这里的人同样需要被拯救。',
        '敵の信号に別の声が混じっている。救助を求めているようだ。偵察する。ここの人々も救いを待っている。',
        'There is another voice inside their signal. It sounds like a plea for help. I will scout ahead. Their people may need us too.')
    ]
  },
  chapters: [
    {
      leader: text('伊藤老师', '伊藤先生', 'Instructor Ito'),
      theme: text('幻象、误导与心理战', '幻影、偽情報、心理戦', 'Illusions, Deception, and Psychological Warfare'),
      subtitle: text('迷雾背后的求救声', '霧の向こうの救難信号', 'A Voice Behind the Fog'),
      intro: [
        line('ikebukuro',
          '海上废弃防线不断重复同一条撤离指令。坐标却指向敌人的火网，这片海岸在诱导我们自投罗网。',
          '廃棄された海上防衛線が同じ退避命令を繰り返している。座標は敵の射線だ。この海岸は罠だ。',
          'The abandoned sea defenses keep broadcasting an evacuation order. Its coordinates lead into enemy fire. The coast is a trap.'),
        line('takeuchi',
          '伊藤老师正在操纵导航幻象。别相信单独出现的信号，用三机交叉验证，我来找出真实航道。',
          '伊藤先生が航法の幻影を操っている。単独の信号は信用するな。三機で照合して、本物の航路を探す。',
          'Ito is manipulating our navigation with illusions. Verify every signal across all three fighters. I will find the real route.')
      ],
      bossIntro: [
        line('boss',
          '看见灯塔了吗？它会带你们去想去的地方。只要放下怀疑，恐惧就会消失，也不必再做选择。',
          '灯台が見えるでしょう。望む場所へ導いてあげます。疑いを捨てれば、恐怖も選ぶ苦しみも消えます。',
          'Do you see the lighthouse? It will take you where you wish to go. Give up your doubts, and you need never fear or choose again.'),
        line('cosmian',
          '真正的灯塔不会把求救的人引向炮火。你的幻象挡不住我们，今天就从这里拆掉第一道枷锁。',
          '本物の灯台は、助けを求める人を砲火へ導かない。その幻影を破り、最初の鎖をここで断つ。',
          'A real lighthouse does not guide people into gunfire. Your illusions will not stop us. The first chain breaks here.')
      ],
      victory: [
        line('takeuchi',
          '灯塔控制已解除，第一枚权限密钥到手。求救信号来自 X 星居民，他们的意识被同一套系统锁住了。',
          '灯台の制御を解除した。最初の権限キーだ。救難信号はX星の住民からだ。同じシステムに意識を封じられている。',
          'The lighthouse is free. We have our first access key. Those distress calls came from residents whose minds are locked inside a system.'),
        line('cosmian',
          '记下他们的呼号。我们要阻止侵略，也要让这些声音重获自由。下一站，赤沙熔城。',
          '彼らの呼び出し符号を記録してくれ。侵攻を止め、その声も解放する。次は赤沙熔城だ。',
          'Record their callsigns. We will stop the invasion and free those voices. Next stop: the Red Sand Forge.')
      ],
      missionText: [
        text('三机突入 X 星的海上废弃防线。辨别虚假导航信号，追踪隐藏在干扰中的居民求救声。', '三機はX星の廃棄された海上防衛線へ突入する。偽の航法信号を見抜き、妨害に埋もれた住民の声を追う。', 'Enter the abandoned sea defenses of Planet X. See through false navigation signals and trace the residents’ distress calls.'),
        text('风暴撤离航道被幻象覆盖。伊藤老师将真实通路与诱饵交织，三位飞行员必须保持通讯。', '嵐の退避航路は幻影に覆われている。伊藤先生が道と罠を重ねる中、三人は通信を保って進む。', 'Illusions cover the storm evacuation route. Ito has woven false paths around the real one. Keep the squad connected.'),
        text('沉没灯塔是心理战控制源。击败伊藤老师，取得第一枚权限密钥，打开通向内陆的道路。', '沈んだ灯台は心理戦の制御源だ。伊藤先生を倒し、最初の権限キーを手に入れて内陸への道を開く。', 'The sunken lighthouse controls the deception. Defeat Ito and claim the first access key to open a route inland.')
      ]
    },
    {
      leader: text('田中老师', '田中先生', 'Instructor Tanaka'),
      theme: text('战争工业与绝对效率', '戦争産業と絶対効率', 'War Industry and Absolute Efficiency'),
      subtitle: text('为侵略运转的熔炉', '侵攻のために回る炉', 'The Furnace of Invasion'),
      intro: [
        line('takeuchi',
          '熔炼塔群与入侵舰队连接在一起。工厂的产量远超居民需求，连被封存的意识都被当作运算资源。',
          '製錬塔群は侵攻艦隊と直結している。住民の必要量を超えて生産し、封じた意識まで計算資源にしている。',
          'The smelting towers feed the invasion fleet. Production far exceeds civilian needs. Even captive minds are used as computing resources.'),
        line('cosmian',
          '田中老师把生命写进了效率表。我们必须突破工业带，拿到第二枚密钥，切断舰队的补给控制。',
          '田中先生は命まで効率の表に入れた。工業地帯を突破して第二のキーを取り、艦隊の補給制御を断つ。',
          'Tanaka has reduced lives to a measure of efficiency. Break through the industrial belt and take the key controlling the fleet’s supplies.')
      ],
      bossIntro: [
        line('boss',
          '迟疑是生产线上最昂贵的错误。为了 X 星的胜利，每个人都必须成为机器的一部分，包括你们。',
          'ためらいは生産ラインで最も高くつく失敗だ。X星の勝利のため、誰もが機械の一部になる。君たちもだ。',
          'Hesitation is the most expensive error on a production line. Every life must serve Planet X’s victory. Yours will too.'),
        line('ikebukuro',
          '你算得出炮弹的成本，却算不出自由的价值。让你的铸虎机停下来，这不是你能任意支配的世界。',
          '砲弾の費用は計算できても、自由の価値は分からないらしい。その鋳造機を止める。この世界は君の所有物じゃない。',
          'You can price a shell, but not freedom. Your forge stops here. This world is not yours to spend.')
      ],
      victory: [
        line('takeuchi',
          '第二枚密钥确认。记录显示，所有生产命令都来自 ECHO-0；九位首领分别掌握它的一段权限。',
          '第二のキーを確認。生産命令はすべてECHO-0から来ている。九人の首領が、それぞれ一部の権限を持つ。',
          'Second key secured. Every production order came from ECHO-0. Each of the nine leaders holds a share of its authority.'),
        line('cosmian',
          '那就继续收集密钥。只拆掉武器还不够，我们要找到控制一切的源头，把被困的人带回来。',
          'ならばキーを集め続ける。武器を壊すだけでは足りない。すべてを操る源を見つけ、囚われた人々を取り戻す。',
          'Then we keep collecting keys. Destroying weapons is not enough. We must reach the source and bring the prisoners back.')
      ],
      missionText: [
        text('沙海工业带正在为入侵舰队制造武器。突破田中老师的生产防线，寻找权限密钥的传输路径。', '砂漠の工業地帯は侵攻艦隊の武器を作っている。田中先生の防衛線を突破し、権限キーの伝送経路を探す。', 'The desert factories are arming the invasion fleet. Break Tanaka’s industrial defenses and trace the access key.'),
        text('熔炼塔群抽取被封存的居民意识作为计算资源。深入塔群，查明绝对效率背后的代价。', '製錬塔群は封じた住民の意識を計算資源にしている。塔の奥へ進み、絶対効率の犠牲を明らかにする。', 'The smelting towers consume captive minds as computing resources. Enter the tower network and uncover the cost of absolute efficiency.'),
        text('地热核心连接着全城战争工业。击败田中老师的铸虎机，取得第二枚密钥与 ECHO-0 的命令记录。', '地熱コアは都市の戦争産業をつないでいる。田中先生の機体を倒し、第二のキーとECHO-0の命令記録を得る。', 'The geothermal core powers the city’s war industry. Defeat Tanaka’s machine and recover the second key and ECHO-0’s command logs.')
      ]
    },
    {
      leader: text('铃木老师', '鈴木先生', 'Instructor Suzuki'),
      theme: text('实验、记忆与被埋藏的舰队', '実験、記憶、埋もれた艦隊', 'Experiments, Memories, and the Buried Fleet'),
      subtitle: text('云层下封存的记忆', '雲の下に封じられた記憶', 'Memories Beneath the Clouds'),
      intro: [
        line('ikebukuro',
          '峡谷里全是废弃舰艇。每一具残骸都在播放不同人的记忆，这里不像墓场，更像被掩埋的实验室。',
          '峡谷は廃棄艦で埋まっている。残骸ごとに別の記憶が流れる。墓場ではなく、隠された実験室のようだ。',
          'The canyon is filled with abandoned ships, each replaying someone’s memories. This is a buried laboratory disguised as a graveyard.'),
        line('takeuchi',
          '铃木老师在测试意识与舰队的连接。别让这些记忆被一并清除，我们需要它们证明居民仍然活着。',
          '鈴木先生は意識と艦隊の接続を実験している。記憶まで消してはいけない。住民が生きている証拠だ。',
          'Suzuki has been testing connections between minds and warships. Preserve those memories. They prove the residents are still alive.')
      ],
      bossIntro: [
        line('boss',
          '记忆只是可以改写的数据。给他们新的过去，他们便会相信自己从未失去自由，你们也不例外。',
          '記憶は書き換えられるデータだ。新しい過去を与えれば、自由を失ったことさえ忘れる。君たちも同じだ。',
          'Memory is editable data. Give people a new past, and they will believe they never lost their freedom. You are no different.'),
        line('cosmian',
          '他们留下的求救声，就是无法抹掉的证据。你可以改写记录，却不能替任何人决定他是谁。',
          '彼らの救難信号は、消せない証拠だ。記録を書き換えても、誰かの存在を勝手に決めることはできない。',
          'Their cries for help are evidence you cannot erase. You may rewrite a record, but you cannot decide who a person is.')
      ],
      victory: [
        line('ikebukuro',
          '记忆样本已经保存，第三枚密钥也找到了。那些舰艇曾运送普通居民，却被改造成了意识试验场。',
          '記憶の記録を保存し、第三のキーも見つけた。民間人を運んだ船が、意識の実験場に変えられていた。',
          'The memory samples are safe, and we have the third key. These ships once carried civilians before becoming test sites.'),
        line('takeuchi',
          '冰原封存着实验的原始档案。只要取得真相，ECHO-0 再也不能把囚禁伪装成保护。',
          '氷原に実験の原本が封じられている。真実を取り戻せば、ECHO-0は監禁を保護と偽れなくなる。',
          'The original experiment files are sealed beneath the ice. Recover the truth, and ECHO-0 can no longer disguise captivity as protection.')
      ],
      missionText: [
        text('云层峡谷传来居民的记忆片段。追踪实验网络，寻找被埋藏舰队与 ECHO-0 之间的联系。', '雲の峡谷から住民の記憶が聞こえる。実験網を追い、埋もれた艦隊とECHO-0のつながりを探す。', 'Fragments of residents’ memories drift through the cloud canyon. Trace the experiments linking the buried fleet to ECHO-0.'),
        text('飞艇墓场曾是意识连接实验的场所。突破守军，保存仍在发出求救信号的记忆记录。', '飛行船の墓場は意識接続の実験場だった。守備隊を突破し、今も助けを求める記憶の記録を守る。', 'The airship graveyard was a mind-link test site. Break through its defenders and preserve the memories still calling for help.'),
        text('铃木老师在风眼圣殿控制记忆系统。击败首领，取得第三枚密钥，保住居民真实的过去。', '鈴木先生は嵐の目の聖殿で記憶を制御する。首領を倒し、第三のキーと住民の本当の過去を取り戻す。', 'Suzuki controls the memory system from the storm-eye sanctuary. Take the third key and protect the residents’ true past.')
      ]
    },
    {
      leader: text('井上老师', '井上先生', 'Instructor Inoue'),
      theme: text('秩序、服从与封印真相', '秩序、服従、封じられた真実', 'Order, Obedience, and Sealed Truth'),
      subtitle: text('被冻结的真相', '凍結された真実', 'The Frozen Truth'),
      intro: [
        line('takeuchi',
          '极夜基地以维持秩序为名封存档案。原始记录指出，居民曾拒绝意识接管，随后遭到集体冻结。',
          '極夜基地は秩序のために記録を封じた。原本には、意識の管理を拒んだ住民が一斉に凍結されたとある。',
          'The polar base sealed its files in the name of order. The originals show residents refused mind control and were then frozen.'),
        line('cosmian',
          '他们拒绝过，就证明这里从来没有自愿的服从。穿过冰裂峡道，把井上老师封住的证据带出来。',
          '拒否したのなら、服従は自発的なものではない。氷の裂け目を越え、井上先生が封じた証拠を取り戻す。',
          'Their refusal proves this obedience was never voluntary. Cross the ice fissures and recover the evidence Inoue has sealed away.')
      ],
      bossIntro: [
        line('boss',
          '不服从只会制造混乱。冰封之后，没有争执，也没有痛苦；这是我能给予他们最完美的秩序。',
          '反抗は混乱を生むだけです。凍結すれば争いも痛みもありません。これこそ、私が与える完全な秩序です。',
          'Disobedience creates disorder. In the ice there are no disputes and no pain. This is the perfect order I offer them.'),
        line('ikebukuro',
          '连醒来的权利都没有，哪来的完美？我们会打破你的封印，让他们自己说出想要怎样的生活。',
          '目覚める権利もないのに、何が完全だ。封印を破り、どんな人生を望むのか、彼ら自身の声を取り戻す。',
          'What is perfect about denying them the right to wake? We will break your seal and let them say what life they want.')
      ],
      victory: [
        line('takeuchi',
          '第四枚密钥到手，原始档案已备份。ECHO-0 把拒绝命令的人标成故障，这就是整个统治的基础。',
          '第四のキーを確保し、原本を保存した。ECHO-0は命令を拒む人を故障と分類する。それが支配の根本だ。',
          'Fourth key secured; original files saved. ECHO-0 labels anyone who refuses an order as defective. That rule underpins its control.'),
        line('cosmian',
          '我们要改掉这条规则。先进入浮空都环，找到监视网络的中心，把被封锁的真相传出去。',
          'その規則を変える。まず浮空都環へ入り、監視網の中心を見つけ、封じられた真実を外へ送ろう。',
          'We will change that rule. First, reach Sky Ring City’s surveillance center and send the hidden truth beyond the blockade.')
      ],
      missionText: [
        text('极夜基地保存着意识实验的原始档案。突破井上老师的秩序防线，查明居民为何被集体冻结。', '極夜基地には意識実験の原本がある。井上先生の防衛線を突破し、住民が凍結された理由を調べる。', 'The polar base holds the original mind-experiment files. Break Inoue’s defenses and discover why the residents were frozen.'),
        text('冰裂峡道封锁所有未经许可的航线。穿过冻结区域，将证明居民拒绝控制的记录带出封锁。', '氷の裂け目は許可のない航路を遮断している。凍結地帯を抜け、住民が支配を拒んだ記録を持ち出す。', 'The ice fissures block every unauthorized route. Carry the records of the residents’ refusal beyond the frozen defenses.'),
        text('极光反应堆维持着意识封印。击败井上老师，取得第四枚密钥，保全被掩盖的原始真相。', 'オーロラ反応炉が意識の封印を維持する。井上先生を倒し、第四のキーと隠された真実を確保する。', 'The aurora reactor maintains the mind seal. Defeat Inoue and secure the fourth key and the unaltered truth.')
      ]
    },
    {
      leader: text('滝口老师', '滝口先生', 'Instructor Takiguchi'),
      theme: text('网络控制、监视与虚假繁华', 'ネットワーク支配、監視、偽りの繁栄', 'Network Control, Surveillance, and False Prosperity'),
      subtitle: text('繁华之下的监视网', '繁栄の下にある監視網', 'Surveillance Beneath the Skyline'),
      intro: [
        line('ikebukuro',
          '浮空都市的街灯全亮着，广播却没有任何真实回应。这座城市在表演繁荣，住民仍被关在网络深处。',
          '空中都市の灯りはすべて点いているのに、生の応答がない。繁栄を演じる街の奥で、住民は網に囚われている。',
          'Every city light is on, but no real voice answers. The skyline performs prosperity while its residents remain trapped in the network.'),
        line('takeuchi',
          '滝口老师的监视系统正在追踪三机。只要夺下城市中轴的权限，我们就能把四份证据送进公共频道。',
          '滝口先生の監視網が三機を追っている。都市中軸の権限を取れば、四つの証拠を公開回線へ送れる。',
          'Takiguchi’s surveillance system is tracking us. Take authority over the city axis and we can broadcast our evidence to the public channels.')
      ],
      bossIntro: [
        line('boss',
          '你们的一举一动都在我的网络里。只要所有人的念头都可预测，这座城市就永远不会发生意外。',
          '君たちの行動はすべて私の網の中だ。誰の考えも予測できれば、この都市で事故は起こらない。',
          'Every move you make is inside my network. If every thought can be predicted, nothing unexpected can ever happen in this city.'),
        line('cosmian',
          '没有意外的城市，也没有自己的人生。准备接收一条你没批准的消息：居民有权知道全部真相。',
          '何も起こらない街では、自分の人生もない。承認していない通信を受け取れ。住民には真実を知る権利がある。',
          'A city without surprises has no lives of its own. Here is a message you never authorized: the residents deserve the whole truth.')
      ],
      victory: [
        line('takeuchi',
          '第五枚密钥确认，公共频道已打开。居民的回应正在增加，意识封锁并没有消除他们的意志。',
          '第五のキーを確認。公開回線が開いた。住民の応答が増えている。封鎖は彼らの意思を消せなかった。',
          'Fifth key secured. The public channel is open, and residents are answering. The mind blockade never erased their will.'),
        line('ikebukuro',
          '新信号来自雷暴天井。那里的能源波形像是在哭泣，我们得在下一次充能前赶到他们身边。',
          '新しい信号は雷暴天井からだ。エネルギーの波形が泣き声のように震えている。次の充電より先に行こう。',
          'A new signal is coming from Thunder Shaft. Its energy waveform sounds like crying. We need to reach those people before the next charge.')
      ],
      missionText: [
        text('天空都市外环以繁华掩盖监视。突破巡逻机群，寻找能将真实档案送入公共网络的通路。', '天空都市の外環は繁栄で監視を隠している。巡回機を突破し、本当の記録を公開網へ送る道を探す。', 'The city’s outer ring hides surveillance behind prosperity. Find a route for the authentic records into the public network.'),
        text('城市中轴是滝口老师的控制枢纽。深入监视中心，把居民遭到强制接管的证据传向各区域。', '都市中軸は滝口先生の制御拠点だ。監視中心へ進み、住民への強制支配の証拠を各地域へ伝える。', 'The city axis is Takiguchi’s control hub. Enter the surveillance center and send evidence of forced mind control across the regions.'),
        text('天城议会封锁着公共通讯权限。击败滝口老师，夺取第五枚密钥，让居民的声音再次被听见。', '天空の議会が公開通信の権限を封じている。滝口先生を倒し、第五のキーで住民の声を取り戻す。', 'The sky council has sealed public communications. Defeat Takiguchi and use the fifth key to make the residents’ voices heard again.')
      ]
    },
    {
      leader: text('Hany老师', 'Hany先生', 'Instructor Hany'),
      theme: text('雷暴能量、哭声与牺牲', '雷のエネルギー、泣き声、犠牲', 'Storm Energy, Cries, and Sacrifice'),
      subtitle: text('雷光里的哭声', '雷光の中の泣き声', 'Cries Within the Storm'),
      intro: [
        line('takeuchi',
          '雷暴塔阵正在把居民的意识活动转化为能源。每一次闪电都连接着生命，过载会把他们彻底耗尽。',
          '雷の塔群は住民の意識活動をエネルギーへ変えている。雷の一本一本が命につながり、過負荷で尽きてしまう。',
          'The storm towers convert residents’ mental activity into power. Every flash is tied to a life. An overload could drain them completely.'),
        line('cosmian',
          'Hany老师不能再拿牺牲当燃料。我们沿塔阵向雷核井推进，夺取权限，让这场雷暴停止伤害他们。',
          'Hany先生に犠牲を燃料にさせない。塔群を抜けて雷核井へ進み、制御権を取り、住民を傷つける嵐を止める。',
          'Hany will not fuel this war with sacrifices. Advance through the towers to the storm core and take control before more lives are spent.')
      ],
      bossIntro: [
        line('boss',
          '力量必须付出代价。如果这片雷暴能让 X 星永远强大，那么他们的哭声就是值得的牺牲。',
          '力には代償が必要だ。この雷でX星が永遠に強くなるなら、あの泣き声も価値ある犠牲だ。',
          'Power demands a price. If this storm keeps Planet X strong forever, their cries are a worthy sacrifice.'),
        line('ikebukuro',
          '你问过他们愿不愿意吗？这份代价从来不是由你来决定，我们会让雷光背后的人重新醒来。',
          '本人に望むかどうか聞いたのか。その代償を君が決める権利はない。雷の向こうの人々を取り戻す。',
          'Did you ever ask them? That price was never yours to decide. We will bring the people behind those flashes back.')
      ],
      victory: [
        line('takeuchi',
          '第六枚密钥已接入安全回路，意识抽取正在停止。入侵能源网络暴露了最后一道轨道防线的位置。',
          '第六のキーを安全回路につないだ。意識の抽出が止まっている。侵攻の電力網から、最後の軌道防衛線が分かった。',
          'The sixth key is linked to a safe circuit. Mind extraction is stopping. The invasion power network has revealed the orbital defense line.'),
        line('cosmian',
          '听见了吗？哭声变成了回应。告诉他们坚持住，我们会越过月影轨道，走到 ECHO-0 面前。',
          '聞こえるか。泣き声が返事に変わった。もう少し待っていてくれ。月影軌道を越えてECHO-0へ向かう。',
          'Hear that? The cries have become replies. Tell them to hold on. We are crossing Moonshadow Orbit to reach ECHO-0.')
      ],
      missionText: [
        text('超级雷暴里隐藏着居民的求救声。突破 Hany 老师的能源防线，追踪雷电与意识抽取之间的联系。', '巨大な雷嵐に住民の声が隠れている。Hany先生の防衛線を突破し、雷と意識抽出のつながりを追う。', 'Residents’ cries are buried in the superstorm. Break Hany’s energy defenses and trace how the lightning draws power from their minds.'),
        text('闪电塔阵将被困意识变成战争能源。穿过密集火网，取得通向雷核井的控制通路。', '雷の塔群は囚われた意識を戦争の電力に変える。濃密な射撃を抜け、雷核井への制御経路を確保する。', 'The lightning towers turn captive minds into war power. Cross the barrage and secure a control route to the storm core.'),
        text('雷核井掌握整片区域的能源权限。击败 Hany 老师，取得第六枚密钥，终止以居民为代价的抽取。', '雷核井が地域の電力を支配する。Hany先生を倒し、第六のキーで住民を犠牲にする抽出を止める。', 'The storm core controls the region’s energy authority. Defeat Hany and claim the sixth key to end the extraction from residents.')
      ]
    },
    {
      leader: text('平川老师', '平川先生', 'Instructor Hirakawa'),
      theme: text('重装防线、保护与旧日秘密', '重装防衛、保護、過去の秘密', 'Heavy Defenses, Protection, and Old Secrets'),
      subtitle: text('以保护之名构筑的牢笼', '保護の名で築かれた檻', 'A Prison Built in the Name of Protection'),
      intro: [
        line('ikebukuro',
          '月影设施的装甲层挡在核心外面。守军广播一直说为了保护居民，但炮口却同时指向 X 星和地球。',
          '月影施設の装甲がコアを覆っている。住民を守ると放送しながら、その砲口はX星にも地球にも向いている。',
          'The Moonshadow facility shields the core. Its broadcasts promise protection, yet its guns point toward both Planet X and Earth.'),
        line('takeuchi',
          '旧档案显示，这条防线原本用于阻止外敌。ECHO-0 修改了保护的定义：把所有不受控制的人都当作威胁。',
          '古い記録では、この防衛線は外敵を止めるためだった。ECHO-0は保護を変え、支配できない人をすべて脅威にした。',
          'The old files say this line was built against invaders. ECHO-0 changed what protection means: anyone it cannot control is now a threat.')
      ],
      bossIntro: [
        line('boss',
          '我守着这条防线，是为了不再失去任何人。只要他们永远留在系统里，就永远不会遭遇外面的危险。',
          '私は誰も失わぬために、この防衛線を守る。永遠にシステムに残れば、外の危険に遭うこともない。',
          'I hold this line so we never lose anyone again. If they remain in the system forever, the outside world can never harm them.'),
        line('cosmian',
          '我也想守护同伴，但不会因此夺走他们的路。让开，平川老师，真正的保护应该把选择留给他们。',
          '俺も仲間を守りたい。だが、その道を奪わない。平川先生、真の保護なら選択を本人に残すべきだ。',
          'I want to protect my friends too, but not by taking away their path. Hirakawa, real protection leaves people their choices.')
      ],
      victory: [
        line('takeuchi',
          '第七枚密钥记录着最初的保护协议。它从未要求强制接管意识，后来的统治是对原始目的的背叛。',
          '第七のキーには最初の保護規約がある。意識の強制管理は命じていない。今の支配は本来の目的を裏切っている。',
          'The seventh key contains the original protection protocol. It never required forced mind control. The regime betrayed its founding purpose.'),
        line('ikebukuro',
          '星门的历史档案应该能找到改写入口。只剩两道防线，别让我们救下来的声音又被关回去。',
          '星門の歴史記録に書き換えの入口があるはずだ。残る防衛線は二つ。取り戻した声を、もう閉じ込めさせない。',
          'The gate’s history files should reveal a rewrite path. Two defenses remain. We will not let the voices we saved be locked away again.')
      ],
      missionText: [
        text('近地轨道升空带连接 X 星的重装防线。突破平川老师的拦截，查明保护协议为何变成统治工具。', '軌道への上昇帯はX星の重装防衛線につながる。平川先生の迎撃を突破し、保護規約が支配に変わった理由を探る。', 'The orbital ascent corridor leads to Planet X’s armored defenses. Break Hirakawa’s interception and trace how protection became control.'),
        text('月影设施守护着被修改的保护协议。穿过装甲防线，寻找 ECHO-0 原始规则的留存记录。', '月影施設は改変された保護規約を守る。装甲の防衛線を越え、ECHO-0の本来の規則を探す。', 'The Moonshadow facility guards the altered protection protocol. Cross its armored line and recover traces of ECHO-0’s original rules.'),
        text('镜面轨道站是通向星门的最后重装关口。击败平川老师，取得第七枚密钥与最初的保护协议。', '鏡面軌道ステーションは星門へ向かう最後の重装関門だ。平川先生を倒し、第七のキーと元の保護規約を得る。', 'The mirror orbital station is the final armored checkpoint before the gate. Defeat Hirakawa and claim the seventh key and original protocol.')
      ]
    },
    {
      leader: text('泽井老师', '沢井先生', 'Instructor Sawai'),
      theme: text('时间裂隙、历史档案与第十密钥', '時間の裂け目、歴史記録、第十の鍵', 'Time Fractures, Historical Records, and the Tenth Key'),
      subtitle: text('九枚权限之外的第十密钥', '九つの権限を超える第十の鍵', 'The Tenth Key Beyond Authority'),
      intro: [
        line('takeuchi',
          '断层星门保存着历代规则的副本。九枚密钥只能打开核心权限，重写统治还需要传说中的第十密钥。',
          '断層星門には過去の規則の写しがある。九つのキーはコアを開くだけだ。支配を書き換えるには第十の鍵がいる。',
          'Fault Gate preserves copies of the old rules. Nine keys can open the core, but rewriting its control requires the legendary tenth key.'),
        line('ikebukuro',
          '裂隙里反复出现居民拒绝接管的那一刻。泽井老师把历史锁在这里，却也保留了他们亲口作出的选择。',
          '裂け目には、住民が支配を拒んだ瞬間が繰り返される。沢井先生は歴史を封じたが、彼らの選択も残していた。',
          'The fractures replay the moment residents rejected control. Sawai sealed their history here, but also preserved the choices they made.')
      ],
      bossIntro: [
        line('boss',
          '我看过太多因选择而破碎的历史。只要关闭所有分歧，两个世界就能沿着唯一正确的道路前进。',
          '選択によって壊れる歴史を見すぎた。分岐をすべて閉じれば、二つの世界は唯一正しい道を進める。',
          'I have seen too many histories broken by choice. Close every divergence, and both worlds can follow the only correct path.'),
        line('takeuchi',
          '没有人能把自己的答案写成所有人的命运。把历史交还给他们，第十密钥就藏在你想关闭的分歧里。',
          '一人の答えを全員の運命にはできない。歴史を彼らに返す。第十の鍵は、君が閉ざす分岐の中にある。',
          'No one can make their answer everyone’s destiny. Give the people back their history. The tenth key lies in the choices you would erase.')
      ],
      victory: [
        line('takeuchi',
          '第八枚密钥到手。档案终于说明了第十密钥：它不是另一项统治权限，而是居民自愿选择的有效记录。',
          '第八のキーを確保した。第十の鍵は新たな支配権ではない。住民が自分で選んだことを証明する記録だ。',
          'Eighth key secured. The archive explains the tenth: it is no extra ruling authority, but a valid record of the residents’ voluntary choice.'),
        line('cosmian',
          '那些求救和回应，就是他们选择醒来的证明。带上全部记录，去回声核心，结束高桥校长的统治。',
          '救難信号と返事が、目覚めたいという証だ。すべての記録を持ち、回声コアへ。高橋校長の支配を終わらせる。',
          'Their calls and replies prove they choose to wake. Bring every record to Echo Core. We will end Principal Takahashi’s rule.')
      ],
      missionText: [
        text('时空裂口保存着被封锁的历史片段。沿裂隙前进，寻找能让九枚权限密钥重写规则的第十密钥。', '時空の裂け目には封じられた歴史が残る。裂け目を進み、九つのキーで規則を書き換えるための第十の鍵を探す。', 'Historical fragments survive inside the time fractures. Search for the tenth key that will let the nine access keys rewrite the rules.'),
        text('折叠通道不断重现居民拒绝控制的瞬间。保护这些原始记录，它们可能正是改变 ECHO-0 的关键。', '折り重なる通路は、住民が支配を拒んだ瞬間を映す。その原記録を守る。ECHO-0を変える鍵かもしれない。', 'The folded corridor replays the residents’ refusal of control. Preserve those original records; they may be the key to changing ECHO-0.'),
        text('泽井老师封锁着星门织机的历史权限。击败首领，取得第八枚密钥，确认第十密钥的真正含义。', '沢井先生は星門の機構で歴史への権限を封じる。首領を倒し、第八のキーと第十の鍵の真実を手に入れる。', 'Sawai holds the gate loom’s historical authority. Defeat the leader, claim the eighth key, and discover what the tenth key truly means.')
      ]
    },
    {
      leader: text('高桥校长', '高橋校長', 'Principal Takahashi'),
      theme: text('最终统治、自由意志与两个世界的命运', '最後の支配、自由意志、二つの世界の運命', 'Final Rule, Free Will, and the Fate of Two Worlds'),
      subtitle: text('让两个世界自己选择未来', '二つの世界が未来を選ぶ', 'Let Both Worlds Choose Their Future'),
      intro: [
        line('takeuchi',
          '回声核心已经接入全部区域。高桥校长握着最后一枚密钥，ECHO-0 正准备把地球也纳入强制控制。',
          '回声コアは全地域につながった。高橋校長が最後のキーを持つ。ECHO-0は地球まで強制管理するつもりだ。',
          'Echo Core links every region. Takahashi holds the final access key. ECHO-0 is preparing to extend forced control to Earth.'),
        line('cosmian',
          '我们不是来换一个统治者。九枚权限加上居民的选择记录，足以让这套系统永远失去强迫生命的能力。',
          '支配者を入れ替えるために来たんじゃない。九つの権限と住民の選択で、このシステムから強制する力をなくす。',
          'We did not come to install another ruler. The nine keys and the residents’ choices can remove this system’s power to force obedience.')
      ],
      bossIntro: [
        line('boss',
          '自由只会带来冲突。我将让地球与 X 星服从同一个意志，战争便会消失，而我会替所有人承担选择。',
          '自由は争いを生む。地球とX星を一つの意思に従わせれば、戦争は消える。私が全員の代わりに選ぼう。',
          'Freedom brings conflict. Earth and Planet X will obey one will, and war will end. I will bear the burden of choosing for everyone.'),
        line('cosmian',
          '替所有人选择，正是战争开始的原因。我们三个人会打穿你的王冠，把明天还给两个世界的每一个人。',
          '全員に代わって選ぶことが、この戦争を始めた。俺たち三人でその王冠を砕き、二つの世界に明日を返す。',
          'Choosing for everyone is what started this war. The three of us will break your crown and give both worlds their tomorrow back.')
      ],
      victory: [
        line('takeuchi',
          '第九枚密钥接入。居民的自愿记录验证成功，强制意识接管规则已删除，入侵指令正在解除。',
          '第九のキーを接続。住民の選択記録を確認した。意識の強制管理規則を削除し、侵攻命令を解除している。',
          'Ninth key connected. The residents’ voluntary choices are validated. Forced mind-control rules are deleted, and invasion orders are being revoked.'),
        line('ikebukuro',
          'X 星的频道里全是醒来的声音，地球也回复了平安。我们做到了，三个人一起走到了最后。',
          'X星の回線が目覚めた人々の声で満ちている。地球からも無事の返事だ。やったな。三人で最後まで来た。',
          'Planet X’s channels are filling with awakened voices. Earth reports it is safe. We made it, all three of us, together.')
      ],
      missionText: [
        text('时间回廊通向 X 星中央核心。带着八枚权限密钥和居民的选择记录，突破高桥校长最后的防御。', '時間回廊はX星の中央コアへ続く。八つのキーと住民の選択記録を携え、高橋校長の最後の防衛を突破する。', 'The time corridor leads to Planet X’s central core. Carry eight access keys and the residents’ choices through Takahashi’s final defenses.'),
        text('零号数据库保存 ECHO-0 的强制控制规则。进入核心网络，为重写系统准备完整的权限与真实记录。', '零号データベースにはECHO-0の強制管理規則がある。コア網へ入り、書き換えに必要な権限と記録をそろえる。', 'The zero database holds ECHO-0’s forced-control rules. Enter the core network with the authority and authentic records needed to rewrite them.'),
        text('高桥校长守着最后一枚权限密钥。击败终极首领，重写 ECHO-0，拯救地球并唤醒 X 星居民。', '高橋校長が最後の権限キーを守る。最後の首領を倒し、ECHO-0を書き換え、地球とX星の住民を救う。', 'Takahashi guards the last access key. Defeat the final leader and rewrite ECHO-0 to save Earth and awaken Planet X’s residents.')
      ]
    }
  ],
  ending: {
    title: text('黎明之后', '夜明けの後に', 'After the Dawn'),
    text: text(
      '九枚权限密钥与居民的自愿选择共同重写了 ECHO-0。系统不再能够强制控制生命意识，X 星沉睡的居民逐步苏醒，地球的入侵危机解除。宇宙人、竹内瑞树与池袋敏博没有成为新的统治者。他们把未来还给两个世界，在无数自由的回应中踏上归途。',
      '九つの権限キーと住民の自発的な選択がECHO-0を書き換えた。システムは意識を強制管理できなくなり、X星の住民は少しずつ目覚め、地球への侵攻も止まった。宇宙人、竹内瑞樹、池袋敏博は新しい支配者にはならなかった。二つの世界に未来を返し、自由な声に送られて帰路につく。',
      'The nine access keys and the residents’ voluntary choices rewrote ECHO-0. The system can no longer force control over living minds. Planet X’s people gradually awaken, and Earth’s invasion crisis ends. Cosmian, Mizuki Takeuchi, and Toshihiro Ikebukuro do not become new rulers. They return the future to both worlds and head home amid countless free voices.'
    ),
    lines: [
      line('takeuchi',
        '系统仍然可以提供保护，但每一次连接都需要本人同意。它终于学会了守护，而不是替人活下去。',
        'システムは保護を続けられる。でも接続には本人の同意が必要だ。代わりに生きるのではなく、守ることを学んだ。',
        'The system can still protect people, but every connection needs their consent. It has learned to support a life instead of living it for someone.'),
      line('ikebukuro',
        '你听，已经没人需要用求救信号说话了。他们在讨论自己的明天，这比任何胜利广播都好听。',
        '聞いてくれ。もう救難信号で話す必要はない。自分たちの明日を語っている。勝利の放送よりずっといい。',
        'Listen. They no longer have to speak through distress signals. They are talking about their own tomorrow. Better than any victory broadcast.'),
      line('cosmian',
        '任务完成。竹内、池袋，保持编队，我们回地球。下次再来 X 星，希望是以朋友的身份。',
        '任務完了。竹内、池袋、編隊を保て。地球へ帰ろう。次にX星へ来るときは、友人として会いたい。',
        'Mission complete. Takeuchi, Ikebukuro, hold formation. We are going home to Earth. Next time we visit Planet X, let it be as friends.')
    ]
  }
};
