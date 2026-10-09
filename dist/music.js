// Chapter order is fixed independently of the selected interface language.
// These files are byte-for-byte copies of the nine uploaded MP3 recordings.
export const MENU_MUSIC=Object.freeze({title:'开头音乐',sourceName:'开头音乐.mp3',src:'assets/music/menu-theme.mp3',duration:147.864,bytes:3460319,sha256:'ac84d99fd122f24d4eb823e45b14a647fc0593ec3767d124a98e69984c896182'});
// The uploaded ending recording is 224.04s. Its final 56.04s are crossfaded
// over 10s to provide a 270s film version, with an eight-second fade to silence.
export const ENDING_MUSIC=Object.freeze({title:'黎明之后',sourceName:'通关音乐.mp3',src:'assets/music/ending-theme.mp3',duration:270,originalDuration:224.04,loop:false});
export const CHAPTER_MUSIC=Object.freeze([
 {chapter:1,title:'静默海岸',src:'assets/music/chapter-01.mp3',duration:197.232,bytes:4656229,sha256:'ba51353bdede713231d62adcc2eb232dbe9dd13167ba2e86966a937edaa30469'},
 {chapter:2,title:'赤沙熔城',src:'assets/music/chapter-02.mp3',duration:164.064,bytes:4069329,sha256:'7f91c07a417759b368f97d8eef7925a8ca0a1a89ff7ab93663edf5762eb28db5'},
 {chapter:3,title:'云墓峡谷',src:'assets/music/chapter-03.mp3',duration:218.424,bytes:5262549,sha256:'7e5ad303604875cf75d6885cc93aedf3ce5f86cfd7b56058ac72d8a1bd4ba3da'},
 {chapter:4,title:'极夜冰原',src:'assets/music/chapter-04.mp3',duration:190.224,bytes:4440612,sha256:'533beb98b76851521073afbc7058f5c6d76b20014f8fa391812f3f9d530c0a78'},
 {chapter:5,title:'浮空都环',src:'assets/music/chapter-05.mp3',duration:207.240,bytes:4881598,sha256:'ceb8c9ddce57e66d75df15dc8decc23c09076b68f229803de8416cc957c27414'},
 {chapter:6,title:'雷暴天井',src:'assets/music/chapter-06.mp3',duration:219.384,bytes:5118080,sha256:'05910947fcba229078d48eee181390072a5caa86dea5e30f0fc043e895bb1084'},
 {chapter:7,title:'月影轨道',src:'assets/music/chapter-07.mp3',duration:227.640,bytes:5459044,sha256:'9bc65b428aa4050f9e7e64875cc9bbee56a3d983a8fc1ac5cb2c45d995fb56c8'},
 {chapter:8,title:'断层星门',src:'assets/music/chapter-08.mp3',duration:240.024,bytes:5933605,sha256:'f65599d63d058100f48464a334f1c7799eefbfcf6a2756ce268b73be1f3914c7'},
 {chapter:9,title:'回声核心',src:'assets/music/chapter-09.mp3',duration:198.432,bytes:4784089,sha256:'3f8237ea99796f1d7cd2074cd63ddaf65451d7663daf4409203814bbe656d65a'}
].map(Object.freeze));

// Chapter order is fixed independently of the selected interface language.
// Second upload: exclusive recordings for the matching Boss battle only.
export const BOSS_MUSIC=Object.freeze([
 {chapter:1,title:'静默海岸',sourceName:'伊藤老师.mp3',src:'assets/music/boss-01.mp3',duration:147.240,bytes:3495971,sha256:'9b2b380ad1b3a672a6dd865b8f11419e409bf51aaa5a5ddd045eed814bc82542'},
 {chapter:2,title:'赤沙熔城',sourceName:'田中老师.mp3',src:'assets/music/boss-02.mp3',duration:152.664,bytes:3664083,sha256:'da0a48b2d5a78b673a06f9f31a4decd1ddb5b7269c065573af7cd579324a4e37'},
 {chapter:3,title:'云墓峡谷',sourceName:'铃木老师.mp3',src:'assets/music/boss-03.mp3',duration:192.432,bytes:4425931,sha256:'49e2eafd325f17264ee12e990fc00b990f1d5d599b21fc42513712843f241b99'},
 {chapter:4,title:'极夜冰原',sourceName:'井上老师.mp3',src:'assets/music/boss-04.mp3',duration:165.000,bytes:3736288,sha256:'9c5061d43252bee8dea2e83425e91c7b435860688bb8d40b14969d54e8ed48ae'},
 {chapter:5,title:'浮空都环',sourceName:'滝口老师.mp3',src:'assets/music/boss-05.mp3',duration:192.384,bytes:4598131,sha256:'03a90d8606bdfccdb4586ecaf3f6562867738ee219e409b964f4ca69790a34b5'},
 {chapter:6,title:'雷暴天井',sourceName:'Hany老师.mp3',src:'assets/music/boss-06.mp3',duration:136.224,bytes:3121971,sha256:'000984e62293f6b7219e71eb556c7f653a2a56776e7cb221bb5a9fc1eeb9aafd'},
 {chapter:7,title:'月影轨道',sourceName:'平川老师.mp3',src:'assets/music/boss-07.mp3',duration:158.424,bytes:3656989,sha256:'7147de9075936ce3cafe5a66bb57022fb75c348533c7371e2c0b164eb3b9e10f'},
 {chapter:8,title:'断层星门',sourceName:'泽井老师.mp3',src:'assets/music/boss-08.mp3',duration:123.624,bytes:2961227,sha256:'fdade407c95edc253d9c5f7d82efb2fef273a376deb90081276fc063181c1d4a'},
 {chapter:9,title:'回声核心',sourceName:'高桥校长.mp3',src:'assets/music/boss-09.mp3',duration:201.240,bytes:4661624,sha256:'32e02435437ab13fa97b755babba426fa71b8f4b7ff413d920d9e65a88489cf7'}
].map(Object.freeze));
