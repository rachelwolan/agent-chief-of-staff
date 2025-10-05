# Video Transcription

**File**: AEO_Masterclass__How_Technical_Leaders_Win_High-Intent_Traffic_.mp4
**Duration**: 45m 27s
**Language**: en

---

## Transcript

**[0:00]**  Welcome to the Deep Dive. We are here today to help you, especially if you're in that technical

**[0:04]**  leadership role, really get your head around possibly the biggest disruption in, well, digital

**[0:11]**  information since Google first started indexing things. Absolutely. If you feel like the ground

**[0:16]**  under the digital marketing world is shaking, you're definitely not wrong. Yeah. The sources we pulled

**[0:21]**  together paint a pretty dramatic picture. The search landscape has changed more just this past year

**[0:26]**  than maybe in the last 10 combined. And that speed, that pace of change, it isn't just, you know,

**[0:32]**  an inconvenience. It's a fundamental challenge, maybe even a threat to businesses relying on

**[0:37]**  that traditional organic traffic. Right. For the technical executive, the person trying to understand

**[0:42]**  the system and explain it, the old SEO playbook, it's, well, it's rapidly becoming obsolete. We're

**[0:48]**  seeing the numbers. Big drops in organic traffic, like 20, even 40% in some industries. And Google's AI

**[0:54]**  overviews alone, the calculations suggest they could cut organic traffic by over 37%. That's huge.

**[1:01]**  And you see it visually too, right? That jog graph everyone's talking about, impression shootup,

**[1:05]**  because AI's spitting out answers for the actual clicks, they're falling. Yeah, users get the answer

**[1:11]**  right there. So why click? It perfectly illustrates why the focus has to shift from clicks to citations.

**[1:18]**  Okay. So that sets up our mission for this deep dive. We need to be really specific here. We're

**[1:22]**  aiming to get past the buzzwords, get under the hood into the, like the engineering layer. Exactly.

**[1:27]**  We need to understand the precise mechanics of this new game answer engine optimization,

**[1:32]**  AEO. We're talking retrieval, ranking, entity mapping, the whole architecture.

**[1:38]**  And then crucially, take all those technical details and synthesize them, turn them into a clear,

**[1:42]**  solid, actionable strategy that you can explain and sell to non-technical leadership.

**[1:47]**  So it's like a whiteboard session. We're breaking down the systems, how they actually work,

**[1:51]**  and figuring out how to position our content to actually win in this new setup.

**[1:55]**  Precisely. We're going to peel back the layers, find the real levers, especially within that

**[1:59]**  retrieval augmented generation or our ag framework, and then land on a concrete strategic plan for

**[2:05]**  the teams who have to build and execute this stuff. All right, let's start with the big shift.

**[2:09]**  We're moving from SEO, search engine optimization to AEO. So first principles, what exactly is AEO?

**[2:18]**  And why is this change so fundamental? Like why does it potentially

**[2:22]**  leap out years of SEO work? Okay, AEO. Answer engine optimization.

**[2:28]**  Basically, it's the practice of engineering your content, structuring it specifically so it gets

**[2:33]**  picked up and surfaced directly by these AI-powered conversational engines. So think chat GPT,

**[2:39]**  Claude perplexity. Exactly. And the generative answers baked into Google search now or Gemini,

**[2:45]**  you're optimizing for the AI summary, not trying to get someone to click your link anymore.

**[2:49]**  We really need to hammer home the contrast between AEO and traditional SEO, because that difference

**[2:54]**  explains that whole jog graph problem. It's a totally different outcome you're aiming for.

**[2:58]**  Traditional SEO was all about the 10 blue links. Right, getting the top 10.

**[3:02]**  Yeah, your goal was ranking high enough knowing the user had to click your link, land on your site,

**[3:06]**  and then manually piece together their answer from whatever you provided. A lot of work for the user.

**[3:11]**  Right, AEO. It operates on what we're calling a binary outcome. It's much darker.

**[3:16]**  Binary. Meaning if a user asks say, what's the best CRM for small agencies?

**[3:23]**  And the AI spits out an answer mentioning four or five companies. Well, those companies get all

**[3:28]**  the visibility. They get the implicit endorsement from the AI. And if you're not in that list,

**[3:33]**  if your brand isn't explicitly cited right there and that immediate answer, you basically don't

**[3:38]**  exist for that query. Might as well be invisible. Wow. Okay. The stakes feel incredibly high then.

**[3:43]**  If we look back at that jog graph, the declining clicks, AEO feels like the necessary

**[3:49]**  counter strategy. You're not just hoping for a click anymore. You're demanding a citation.

**[3:53]**  Absolutely. It's about legitimacy, authority being part of the answer. The competition is

**[3:58]**  definitely steeper because there are way fewer spots in that AI summary than on page one of Google.

**[4:02]**  But you mentioned it upside earlier, even though clicks are fewer, the intent of those clicks.

**[4:08]**  Yes, the intent is orders of magnitude higher. That's the crucial tradeoff.

**[4:12]**  Okay. So that higher quality traffic that justifies the potentially harder work of getting cited.

**[4:19]**  Precisely. Think about it. The click through rate is lower because, well, the AI already gave

**[4:25]**  the basic answer. Right. But the user who does click through, they're highly qualified. They're

**[4:30]**  not just browsing. They're looking for specific detailed follow up info after being sort of

**[4:36]**  primed by the AI conversation. Primed. Meaning they already know roughly what they want. Exactly.

**[4:42]**  They've likely gone back and forth with the AI already. They know what they want. Maybe why they

**[4:46]**  want it. We'll see later how this priming leads to frankly radical lifts and conversion rates.

**[4:51]**  It's significant. Hashtag's hashtag 1.2 deconstructing the answer engine architecture.

**[4:56]**  LLM plus RG. Okay. Let's get technical. Let's go to that engineering

**[4:59]**  layer you mentioned. When an AI gives an answer, we hear the term LLM all the time. But what's

**[5:04]**  the actual system diagram? What's happening under the hood that we as content publishers or

**[5:09]**  product builders can actually influence? Right. For AEO, the key architecture piece you need

**[5:13]**  to understand is the combination of the LLM and RG. LLM, large language model. That's the engine

**[5:19]**  generating the text. Yeah. That's the predictive engine. It makes the text sound human coherent

**[5:23]**  conversational. But and this is critical for current. Factual query is the LLM on its own can,

**[5:30]**  well, hallucinate. Make stuff up. Exactly. So to prevent that, especially for commercial or timely

**[5:36]**  questions, it needs to ground its answers in real-time information. That grounding mechanism. That's

**[5:43]**  RAG, retrieval augmented generation. Okay. RAG, retrieval augmented generation. So the LLM is the

**[5:50]**  writer and RAG is maybe the super fast research assistant. Is that a fair analogy? That's a pretty

**[5:56]**  good way to think about it. Yeah. When a user types in a complex question or prompt, RG's first

**[6:00]**  job is to figure out what information is needed. It often converts that natural language prompt into more

**[6:05]**  structured search queries. Okay. Then it does this incredibly fast semantic search across its index.

**[6:10]**  It's looking for content whose meaning matches the query's intent, not just matching keywords like

**[6:16]**  OLS. That's the poetic search. Yeah. Now that involves embeddings, right? Yeah. That's the term

**[6:20]**  technical folks need to grasp. Absolutely critical embeddings. Think of an embedding as a numerical

**[6:26]**  fingerprint, a vector that represents a piece of content, maybe a paragraph, a whole document,

**[6:31]**  even an image in this high-dimensional mathematical space. The mathematical representation of meaning.

**[6:36]**  Essentially, yes. And RAG uses specialized vector databases to store and quickly search through

**[6:42]**  these embeddings. When you ask a question, RAG turns your question into its own vector,

**[6:48]**  and then it finds the content vectors in its database that are mathematically closest. Closest

**[6:53]**  in meaning exactly. So it's retrieving based on semantic similarity. This is a huge shift from

**[6:58]**  just keyword matching. So this implies that if our content is really well structured, clear,

**[7:04]**  focused. If it has strong entity salience as the jargon goes, it'll generate a tighter, more

**[7:10]**  relevant vector. Easier for a rag to find. You've got it. Structure and clarity become paramount for

**[7:15]**  retrieval. So once RAG retrieves these, say, top five or 10 relevant documents, these are effectively

**[7:21]**  the potential citations. It feeds those specific snippets of text to the LLM. The LLM then takes

**[7:27]**  those grounded snippets and synthesizes them, summarizes them into the final answer you see.

**[7:32]**  It ensures the answer isn't just made up. It's based on current data pulled by RAG.

**[7:37]**  Right. So for the executive listening, the key insight here is.

**[7:40]**  The key insight is this. Your optimization efforts, your AEO strategy, need to focus almost

**[7:46]**  entirely on the R piece. On influencing that real-time search and the citations, it pulls.

**[7:51]**  Not the LLM's core training data. Trying to influence the core training data is, frankly,

**[7:57]**  often impossible for timely updates, incredibly expensive and slow. The leverage point is in the

**[8:02]**  retrieval step that IRRIC system. We optimize the research assistant, the librarian fetching the

**[8:08]**  books, not the entire library's decades-old collection. Okay. So if Eric pulls multiple sources,

**[8:13]**  and the LLM summarizes them, this changes the whole definition of winning a search result,

**[8:18]**  doesn't it? Completely, especially for those broader head terms. It becomes a volume game,

**[8:22]**  but a game of citation volume within that pool are RAG bowls from. How so?

**[8:26]**  In traditional SEO, ranking hashtag one often meant you won the click, end of story.

**[8:31]**  In AEO, the LLM is looking at many citations. To truly win, maybe be the first brand mentioned,

**[8:38]**  or have your viewpoint dominate the summary you need to be cited as many times as possible

**[8:42]**  across those sources, RE considers authoritative. So it's less about being hashtag one on one list,

**[8:47]**  and more about showing up consistently across many lists, building broad entity authority.

**[8:53]**  Precisely. You want the AI to see your name, your data, your perspective,

**[8:58]**  repeatedly when it looks for answers on a topic. And the tail is changed too, right? You mentioned

**[9:03]**  the prompts themselves are different. Inmassively, the depth of conversation is incredible.

**[9:07]**  User prompts and systems like chat GPT are way longer than old Google searches. We're talking

**[9:12]**  80, maybe 91 words on average in the US and UK. Compared to like three or four words on Google.

**[9:18]**  Exactly. These AI systems are built for that depth. They handle follow-up questions,

**[9:22]**  complex scenarios, niche problems really well. Which suggests we can maybe stop battling so hard

**[9:27]**  for those super competitive generic three word keywords. Yes. And focus instead on answering those

**[9:33]**  specific, niche, high-intent questions, where frankly, the competition might be thin or even

**[9:39]**  non-existent right now. Find the long tail questions people are really asking the AI.

**[9:43]**  Absolutely. This massively expands the long tail. For a business, this means digging into your own data,

**[9:49]**  what questions come up and support tickets? What specific language do customers use on sales calls?

**[9:55]**  Those are the gold mines. Those are the specific problems people are asking the AI to solve right now.

**[10:00]**  Turn those into content. Okay, make sense. Now the big question. Where is RG getting these citations?

**[10:07]**  What are the off-site channels, the ranking signals that seem to carry the most weight for AEO?

**[10:12]**  Based on what we're seeing and what the sources indicate, there are three key areas where these

**[10:16]**  LLMs are heavily indexing content and crucially seem to trust it. Sometimes more than traditional

**[10:22]**  websites. Okay, what are they? First, UGC user generated content. Specifically, platforms like Reddit

**[10:28]**  and Quora. Reddit, really? Isn't that chaotic? It can seem that way, but for certain queries,

**[10:34]**  especially recommendations, comparisons or real-world troubleshooting, the AI systems seem to

**[10:40]**  place high value on it. Why? The perception is that it's more authentic, it's community-vetted,

**[10:46]**  it's less likely to be pure marketing spin. The systems are tuned to look for that kind of social

**[10:51]**  proof. Okay, but the immediate risk that comes to mind is if every company floods Reddit with

**[10:57]**  marketing crap, doesn't it just become SEO span all over again? How does an executive guide their

**[11:02]**  team to do this authentically without, you know, getting instantly banned? That is the absolute

**[11:08]**  tightrope walk. And you're right, Bleat and Spam doesn't work, the sources are clear,

**[11:13]**  automated spam gets detected and shut down fast by moderators and the community itself.

**[11:17]**  So what does work? The successful approach seems to be deploying a genuinely authentic strategy.

**[11:23]**  This means using real accounts, maybe identifying yourself or your affiliation clearly,

**[11:27]**  and actually providing useful information first. Solve the user's problem in the thread before

**[11:31]**  subtly linking back if appropriate. So quality over quantity, a few really good helpful

**[11:36]**  upvote in comments that show real expertise. Exactly. That demonstrates authority in a way that

**[11:42]**  mass spamming never can. The AI is likely looking for those signals upvotes, engagement,

**[11:48]**  account age, karma as proxies for trust. It's shifting from pure marketing volume to demonstrating

**[11:53]**  community expertise. Okay, UGC is one, what's the second? Second video content, primarily YouTube,

**[11:58]**  but also Vimeo and similar platforms. This is a huge, often really untapped opportunity,

**[12:04]**  especially in B2B or niche technical areas. Why untapped videos everywhere? Yes, but most video

**[12:10]**  content is consumer focused entertainment, tutorials for common software, things like that.

**[12:16]**  There's a massive vacuum for videos addressing highly specific, maybe less glamorous,

**[12:20]**  but high value B2B or technical topics. Yeah. Think about keywords like AI-powered

**[12:26]**  payment processing APIs for healthcare compliance or integrating looker dashboards with Salesforce

**[12:31]**  activity logs. Very specific high LTV searches. And probably not many videos about those topics exist.

**[12:37]**  Often, almost none. If you create a clear authoritative video answering that specific technical

**[12:43]**  question, you might become the only relevant video citation the AI can find. So if the text index

**[12:48]**  is getting crowded, the video index, especially for new B2B, is still kind of a blue ocean.

**[12:53]**  That's a great way to put it. The barrier to entry for producing good technical video might be

**[12:58]**  higher, but the reward for being the go-to video citation can be immediate and significant.

**[13:04]**  Okay, UGC video. Yeah. What's the third key area? Third is affiliates and tier one media. This is

**[13:10]**  more traditional, but still very important. High authority publishers, big media conglomerates

**[13:15]**  think properties owned by companies like .-meradith, for example. The big names. Yeah. Yeah.

**[13:20]**  They have enormous content libraries covering almost everything and they carry significant domain

**[13:25]**  authority that the AI systems recognize and trust. Getting mentioned or cited on these high

**[13:30]**  authority channels is still highly effective for AEO. But that sounds expensive. It often is. It's

**[13:36]**  essentially paying for high authority citation velocity. It works, but it's usually a higher cost

**[13:41]**  strategy and can be complex to manage relationship wise. Okay, so we've established.

**[13:46]**  Argy is looking for diverse authoritative citations, often off site. And the whole search process

**[13:52]**  is shifting towards extraction. How does this change how we structure content on our own websites?

**[13:57]**  How do we take this knowledge about embeddings and semantic search and apply it to our site's content

**[14:03]**  structure? This is really the core of onsite AEO content engineering. It requires a fundamental

**[14:08]**  shift in thinking, moving away from traditional narrative blog posts towards what we might call

**[14:14]**  structured extraction. Fructured extraction meaning meaning you have to largely abandon the long

**[14:19]**  rambling blog post style that's designed to hook a human reader and build suspense. That doesn't

**[14:24]**  work for AI extraction. Why not? Because the AI isn't reading for pleasure. It's scanning for

**[14:29]**  answers. It needs clear, concise, structured question answer formats. Think FAQs, definitionless,

**[14:36]**  tables, clearly headed sections, answering specific points, anything that makes it incredibly

**[14:40]**  easy for the AI to parse the text, extract a definitive answer and cite it without getting bogged

**[14:45]**  down in dense prose or storytelling. So if the AI is looking for say, how does feature X handle data

**[14:51]**  import limits? The answer shouldn't be buried paragraphs deep after a customer quote. It needs

**[14:57]**  its own heading and a direct answer. Absolutely. Or even better, an actual Q&A block labeled data

**[15:02]**  import limits for feature X. Remember, the LLM and Agrag are optimizing for speed and relevance.

**[15:09]**  Every extra millisecond they spend trying to decipher your narrative is a chance they'll just

**[15:13]**  grab it a clearer answer from somewhere else. That makes sense. This leads to the AEO version of

**[15:18]**  that old SEO check that deserve to rank test. Exactly. The old test was, look at the top 10

**[15:23]**  blue links, are you better? The new test is much more direct and honestly, maybe more humbling.

**[15:29]**  How does it work? It's the AI reality check. You, the technical executive, need to take your key

**[15:34]**  topics, your key questions and ask them directly to chat, GPT, perplexity, Gemini, whatever your

**[15:39]**  audience uses. Then look closely at the answers and especially the citations the AI pulls.

**[15:45]**  Then ask the hard question. Does my current page on this topic honestly deserve to rank higher,

**[15:51]**  be cited more prominently than what the AI is actually using right now, based purely on structure,

**[15:57]**  clarity and definitive answers? Ouch. What if the answer is no? What if it's citing

**[16:02]**  like a random Reddit thread because it's clear? Then you have your mandate. If a Reddit thread

**[16:07]**  answers the question more directly and simply than your beautifully designed 10 page white paper,

**[16:12]**  you need to fundamentally overhaul that white paper content. Break it down, structure it for

**[16:16]**  extraction. It provides a clear competitive benchmark for your content teams. It's not subjective

**[16:21]**  anymore. It's about feeding machine efficiently. Hashtag tag tag 2.2 internal linking as entity mapping,

**[16:27]**  the semantic structure. All right, let's pick. This is probably one of the most critical technical

**[16:31]**  pivots for on site, AEO. Internal links are no longer just like plumbing to spread authority

**[16:37]**  around. They are now the primary mechanism you use to define the semantic structure of your entire

**[16:43]**  site for both Google and the LLMs. Semantic structure. Okay, unpack that. We're moving beyond

**[16:48]**  links used to entity mapping. You're essentially building your own internal proprietary knowledge graph

**[16:54]**  about your products, your services, your expertise. Entity mapping. Okay, help translate that.

**[16:59]**  For someone building a product or managing content, what's an entity in this context?

**[17:05]**  An entity is basically any key concept, any important noun. It could be an idea, a specific product

**[17:11]**  feature, the product itself, a target customer persona, an industry term. Like CRM platform or

**[17:17]**  pipeline management feature. Exactly. Search engines and LLMs increasingly understand the world

**[17:22]**  through these entities and, crucially, the relationships between them. Your internal linking strategy is

**[17:28]**  how you explicitly map out those relationships on your own site. You're telling the AI, hey, on

**[17:32]**  our platform, these two concepts are directly related in this specific way. Okay, so it's about

**[17:37]**  reinforcing connections. How does a team practically build this entity map? Give us that B2B

**[17:43]**  ASOS example again, maybe with the CRM. Okay, CRM platform. You start by defining a clear hierarchy.

**[17:49]**  You'd have hub or pillar pages. These represent the main parent entities. Your top level page

**[17:55]**  titled something like our complete CRM platform overview. Got it. The big picture. Then you have

**[18:01]**  cluster pages. These dive into the sub entities, the specific components. So individual pages for

**[18:07]**  sales pipeline management feature, email automation service, lead scoring models, etc.

**[18:11]**  Makes sense. Hub and spoke essentially. Sort of, but the crucial part, the strategic layer, is cross-linking

**[18:17]**  the clusters to model how these things actually work together in the real world.

**[18:21]**  Ah, so not just linking up to the hub, but linking between the spoke.

**[18:24]**  Precisely. If your pipeline management feature integrates directly with your email automation service,

**[18:29]**  you must link those two cluster pages together. And critically, you use anchor text that

**[18:34]**  describes that relationship. So the link text itself matters hugely. Absolutely. This isn't just

**[18:40]**  about passing authority anymore. It's about providing clear, definitional context for the AI.

**[18:45]**  It's like building a dictionary and a relationship map simultaneously. Which brings us to anchor text.

**[18:50]**  We need anchor text disambiguation, you called it. Yes. This requires organizational discipline.

**[18:56]**  You have to move away from vague anchor text like click here, learn more, or just the feature name.

**[19:03]**  Be specific. Be hyper specific and consistent. If you're linking from the email automation page

**[19:08]**  to the pipeline management page because they integrate, the anchor text should be something

**[19:12]**  explicit like integrate email campaigns with our sales pipeline management tools. So if different

**[19:18]**  team members use slightly different phrases for the same link destination like sometimes pipeline

**[19:23]**  feature, sometimes sales pipeline, sometimes managing pipelines, that dilutes the signal. Exactly.

**[19:29]**  In consistency creates semantic noise. It confuses the RIG system when it's trying to understand

**[19:35]**  the canonical definition of that entity and its connections. Consistency is absolutely key to

**[19:41]**  training the AI on your specific product structure and terminology. And you mentioned personas

**[19:46]**  earlier, should they be part of this map too? Definitely. Include your target personas as entities.

**[19:52]**  For instance, if you have a piece of content aimed at the VP of marketing persona,

**[19:57]**  that content should link directly to the specific feature page that solves their primary pain point.

**[20:02]**  Use anchor text that makes that connection explicit. This feature addresses the VP of marketing's

**[20:08]**  need for X, learn more here. The semantic depth helps your ag retrieve your content for those

**[20:14]**  really complex conversational queries that mention roles or specific use cases. Okay, entity mapping

**[20:21]**  is huge. Let's cover some essential technical table stakes. The foundational things that just have

**[20:25]**  to be in place before any AEO strategy can even begin to work. What's easily missed? The single

**[20:31]**  biggest easiest to miss technical blocker is simply AI crawling access. Meaning many companies,

**[20:37]**  especially larger or more conservative ones, have default security settings or robots.txt rules

**[20:43]**  that block unknown web crawlers. But if you're blocking bots like OpenAI, Searchbot,

**[20:49]**  Google's Expandedbot, the Proplexity Crawler, various GPT bots, you're literally preventing them

**[20:56]**  from seeing your content in the first place. So you're not even in the race? Not even at the starting

**[21:00]**  line. You must go into your firewall settings, your CDN rules, your robots.txt, and explicitly

**[21:06]**  whitelist these known AI crawler user agents. It sounds basic, but it's the easiest way to fail

**[21:13]**  immediately. Check that first. Okay, critical check. Assuming the bots can access the site,

**[21:18]**  where's the low-hanging fruit in terms of content types right for AEO? Help Center optimization.

**[21:23]**  This is a massive, often completely overlooked gold mine for AEO. Your support docs, why? Because

**[21:29]**  help centers and technical documentation are naturally structured around answering very specific,

**[21:34]**  long-tail, often technical questions. They cover features, integrations, troubleshooting steps,

**[21:40]**  niche use cases, exactly the kind of precise follow-up information that LLMs need to feed a rag,

**[21:45]**  but which marketing blogs rarely cover well. Right, they're already kind of in that Q&A format.

**[21:50]**  Often yes, they're perfectly positioned. So the tactical recommendation here for, say,

**[21:55]**  a product team is consolidate authority and structure it well. The technical recommendation is

**[22:00]**  usually to move your help center content onto a sub directory of your main domain, like your

**[22:05]**  company.com for sash with help, rather than isolating it on a sub domain like help.yourcompany.com.

**[22:12]**  Why the sub directory? Subdirectories generally do a better job of consolidating and

**[22:16]**  sharing authority signals with the main domain. It helps the whole sites perceived expertise.

**[22:21]**  Also, ensure you have deep, thorough internal linking within the help center itself,

**[22:25]**  connecting related articles, and proactively use your internal data, those support tickets,

**[22:30]**  common questions from sales to create new help content that fills gaps, especially for obscure,

**[22:36]**  but important use cases. Don't wait for users to ask and anticipate the AI's needs.

**[22:40]**  Okay, make sense. And finally, what about good old-fashioned SEO practices? Are they just dead?

**[22:46]**  No, absolutely not. They're the necessary foundation. They're the barrier to entry for

**[22:49]**  aggregate, even considering your content. Our rag is retrieval process usually starts with something

**[22:54]**  like a traditional web search or accessing a specialized index built similarly. Your content

**[23:00]**  still needs decent page authority, quality backlinks, and solid technical optimization to even

**[23:05]**  make it into that initial pool of candidates that our rag analyzes. If your page takes 10 seconds

**[23:10]**  to load or has major crawl errors, it's likely out before it even gets assessed semantically.

**[23:15]**  And schema markup. Still important. More important than ever, arguably. Schema markup is crucial.

**[23:22]**  Think of structured data via schema as the AI's cheat sheet. It's nutritional label for your

**[23:26]**  content. Nutritional label, I like that. It allows the LLM to instantly understand the structure

**[23:31]**  and key elements of your page. Is this a product? Does it have reviews? What's the price? Is this a

**[23:36]**  Q&A page without having to guess or infer it from the raw text? Which is vital for certain types of

**[23:41]**  AEO. Especially vital for commerce AEO. If you want the AI to show those nice clickable product cards

**[23:48]**  with images, prices, ratings, it needs clean structured schema data to generate them. If your schema

**[23:54]**  is messy or missing, the AI will likely skip your page and grab data from a competitor with cleaner

**[24:00]**  markup. Don't neglect the fundamentals. All right, we've got deep into the mechanics,

**[24:05]**  average entities, citations structure. Now, let's bridge this back to the executive level. We need

**[24:11]**  to translate this complex system into tangible business impact. What is the actual value

**[24:17]**  of AEO traffic? Our sources mentioned a pretty stunning data point on conversion rates.

**[24:22]**  Yeah, the data here is potentially transformative for how you justify AEO investment. The core

**[24:27]**  message is AEO traffic is significantly more valuable because the user intent is so much higher.

**[24:32]**  And the example is WebSLA. Yes, the Webflow example cited is really staggering. They reportedly

**[24:36]**  saw a 6x conversion weight difference. Six times higher conversion for traffic coming from LLM

**[24:41]**  interactions compared to traditional Google search traffic. Six times. Okay, that's not a small

**[24:46]**  difference. That implies the traffic is fundamentally different in quality. Why? Why is it so much higher?

**[24:52]**  You have to contrast the user journeys. Think about the typical SEO user journey. Someone

**[24:57]**  types best CRM into Google. They get 10 links. Maybe they click the first one, skim the headline,

**[25:03]**  realize it's not quite right for their specific need and they bounce. Yeah, happens all the time.

**[25:08]**  Low intent, still exploring. Exactly. Low unrefined intent. Now, picture the AEO user journey.

**[25:15]**  They don't just type best CRM. They type or say a detailed multi-turn prompt like,

**[25:21]**  okay, I run a 10% digital marketing agency. We focus on e-commerce clients. I need a CRM that

**[25:27]**  integrates really well with Shopify. Let's me create custom sales pipeline stages easily. And maybe

**[25:33]**  connects to our project management tool. Much more specific way more specific. They might spend

**[25:37]**  five minutes having a conversation with the AI asking follow questions clarifying features. Does

**[25:41]**  do a how about B what about C? They're essentially prescreening, defining their needs,

**[25:46]**  and eliminating friction points before they even see your brand's link in the citation.

**[25:50]**  So by the time they click, by the time the AI provides a summary citing their product and the

**[25:54]**  user does click that link to your site, they are as we said primed to buy. They're not clicking to

**[26:00]**  figure out if your product is relevant. They're likely clicking to find the pricing page for that

**[26:06]**  specific Shopify integration feature they just discussed with the AI. Wow. Okay. That

**[26:11]**  dramatically reduces the friction needed on the website to convert them.

**[26:14]**  Radically reduces it. The AI did the initial qualification and filtering that higher intent

**[26:21]**  directly translates to those higher conversion rates. That makes the argument for pursuing

**[26:25]**  citation quality over just raw, clicked volume undeniable. But this high intent conversational

**[26:32]**  journey creates a big measurement problem, doesn't it? Especially for B2B sales cycle.

**[26:37]**  Huge measurement challenge. Yes. If someone has a long chat with Chatchy PT,

**[26:41]**  closes the window, the later opens a new tab and types your brand name directly.

**[26:45]**  Attribution tools will just see that as direct traffic or maybe brand search, right?

**[26:49]**  They completely miss the AEO influence. Exactly. Last touch attribution, which so many systems

**[26:55]**  rely on, becomes basically useless for capturing the true ROI of AEO.

**[27:00]**  So as an executive, how do you mandate better measurement? What needs to be tracked?

**[27:05]**  You need a two-pronged approach. First, you absolutely must invest in specialized

**[27:10]**  answer tracking tools. These are evolving beyond old keyword ranked trackers. What do they measure?

**[27:16]**  They focus on share of voice within the AI answers themselves. So for a set of target questions

**[27:21]**  or topics, how often is your brand actually cited in the AI summary? What's your average position

**[27:26]**  within that summary? Are you mentioned first or buried? How prominent is the citation?

**[27:32]**  And critically, tracking this across different AI surfaces, chat GPT,

**[27:36]**  perplexity, Gemini, etc. because the results differ. So share voice here isn't just ranking

**[27:41]**  hashtag one. It's about frequency and prominence of citation across the board.

**[27:45]**  Precisely. It's monitoring maybe a thousand queries relevant to your industry daily,

**[27:49]**  checking how often you show up if you're the first mentioned if the AI directly quotes your

**[27:52]**  content snippet. It's tracking your entity's appearance, not just a link's position.

**[27:57]**  Okay. Answer tracking for share voice. What's the second prong?

**[28:01]**  The second piece is more qualitative but just as important. You have to implement

**[28:05]**  better post conversion tracking. Simple questions like adding how did you first hear about us

**[28:11]**  to your demo request forms or onboarding surveys. You need to capture that self reported data

**[28:16]**  to understand the influence of AI conversations that happen way before the final click.

**[28:20]**  Hashtag tag 3.2 Myoset Search everywhere executive framework.

**[28:24]**  Okay. So AEO isn't killing SEO. It's evolving it. Maybe absorbing parts of it.

**[28:30]**  If the overall search pie is getting bigger or at least changing shape and Google's

**[28:35]**  traditional blue link slice might be staying roughly the same size but is now only one piece.

**[28:40]**  What's the overall change strategic mandate for leadership?

**[28:43]**  The mandate has to be broader now. It's about embracing search everywhere optimization.

**[28:47]**  Right. Or maybe think of it as SEO plus AEO plus GEO, gendered

**[28:50]**  dimension optimization plus LLMO large language model optimization. It's a mouthful.

**[28:55]**  But the point is. It'll be a one-trick pony. Exactly. The biggest strategic failure right now

**[28:59]**  is being laser focused only on Google organic results. Attention is fragmented.

**[29:04]**  Users are getting answers and discovering products on YouTube through Reddit discussions,

**[29:09]**  the LinkedIn content directly within Google's AI answers, and inside chatbots like chat GPT or

**[29:15]**  perplexity. Winning requires optimizing your presence across all the channels where your audience

**[29:21]**  is seeking information. And we need to treat these different AI engines. Chat GPT perplexity,

**[29:25]**  Gemini, Claude. Not as one monolithic thing, but as separate surfaces. Because they cite sources

**[29:32]**  differently. That is the critical engine designer perspective. You need to internalize as a strategist.

**[29:37]**  They absolutely use different retrieval algorithms, different data sources, and apply different

**[29:41]**  trust signals. And the source data showed significant differences. Yeah. The numbers cited suggest,

**[29:46]**  for example, perplexity might have a high citation overlap with traditional Google results,

**[29:50]**  maybe around 70%. This means strong traditional SEO still heavily impacts perplexity rankings.

**[29:56]**  But chat GPT, depending on the query type, it might only have a 35% overlap with Google.

**[30:02]**  It could be leaning much more heavily on unique sources like specific Reddit threads,

**[30:06]**  academic papers, or video content that Google might not surface as prominently for that same query.

**[30:12]**  Wow, only 35% overlap potentially. So if your goal is to maximize share of voice overall,

**[30:18]**  optimizing just for Google's traditional algorithm absolutely does not guarantee you'll show up well

**[30:23]**  and chat GPT answers. Correct. It mandates that diversified citation strategy we talked about.

**[30:29]**  You need to build authority signals across Reddit, YouTube, high authority media, in your own site.

**[30:35]**  And strategically, maybe you need to figure out which AI engines your specific target audience uses

**[30:40]**  most and prioritize optimizing for those engine citation preferences. Exactly. It becomes a much

**[30:45]**  more precise allocation of resources. If your audience is primarily developers using perplexity

**[30:50]**  for coding questions, your strategy might lean more towards traditional SEO signals.

**[30:55]**  If their business users asking complex strategy questions in chat GPT,

**[30:59]**  you might invest more heavily in thought leadership content and UGC outreach.

**[31:03]**  Okay, strategy covered. Let's talk risk mitigation. This is crucial for any technical executive

**[31:09]**  implementing new tech. What's the big systemic threat related to all this AI-generated content

**[31:14]**  that leadership really needs to get their heads around? The major danger, the systemic risk,

**[31:18]**  is what some are calling the AI spam cycle. This is the potential negative feedback loop created

**[31:23]**  by the mass production of unassisted purely 100% AI-generated content that lacks real human oversight,

**[31:30]**  expertise, or original insight. And the fear is, what happens if the AI start learning from that

**[31:35]**  AI-generated spam? Exactly. If LLMs are constantly trained on or tree via RJ, content that is just

**[31:42]**  a derivative of other AI summaries, which themselves were derivatives, the overall quality and

**[31:47]**  diversity of information online could decay. This sounds like the concept of model collapse.

**[31:51]**  Yes, that's the term often used. Model collapse is the theoretical risk of systemic decay in data

**[31:57]**  quality. If AI systems are predominantly trained on their own synthetic output or output derived

**[32:03]**  from it, they could start to forget the nuances of the original human data. They might converge on

**[32:08]**  a simplified, averaged out potentially inaccurate view of the world. Imagine, speculatively,

**[32:15]**  if most new articles about ice cream were just AI rewrites of the top five existing articles.

**[32:21]**  Over time, maybe the AI systems forget about the stashew or rum reason because vanilla and

**[32:26]**  chocolate are mentioned most often. The wisdom of the crowd shrinks, becoming an echo chamber,

**[32:31]**  amplifying the most common denominator. And for users, the result is bland, repetitive,

**[32:36]**  potentially wrong information. Correct. Which paradoxically creates a huge opportunity.

**[32:42]**  The solution to this potential decay lies in doubling down on human expertise and original

**[32:47]**  research. So the counter move is authenticity. Precisely, the future isn't just pure AI content.

**[32:53]**  It's AI assisted content with strong human oversight. Your unique experience, your company's

**[32:59]**  proprietary data, your engineers deep knowledge, genuine customer insights, true authoritativeness

**[33:05]**  and trustworthiness, Google's EET signals essentially become critical differentiators.

**[33:11]**  So things AI can't easily replicate. Exactly. Those become the factors that prove your content

**[33:17]**  isn't just another derivative. And ultimately, the algorithms themselves desperate for fresh,

**[33:22]**  reliable information to combat collapse will likely be tuned to reward that genuine quality

**[33:27]**  and originality. Your unique insights become strategic content assets.

**[33:31]**  Okay, that's the strategic response. What about a more immediate tactical concern?

**[33:35]**  Many typical executives worry about their company's valuable proprietary data being scraped and

**[33:40]**  used to train these big commercial LLM. Is there a technical guard rail? Yes, there is a way

**[33:45]**  to manage this, though it requires careful implementation. You can differentiate between bots.

**[33:50]**  It's possible to configure your robots.txt file to block specific AI training bots. The ones

**[33:57]**  known to be used for large-scale model ingestion by companies like OpenAI or Google,

**[34:01]**  while still allowing the specific indexing bots that the RRAG-A systems use for real-time retrieval.

**[34:06]**  Ah, so block the training, allow the answer. Essentially, yes. You allow the bots needed to fetch

**[34:12]**  your content for citations and answers, like GPT bot or Google extended, but you disallow the bots

**[34:18]**  known primarily for harvesting data for model training. It allows you to participate in AEO and get

**[34:23]**  cited without necessarily contributing your core IP to the next version of the foundational model itself.

**[34:29]**  That's a crucial technical nuance the Ops or Web team needs to understand and implement correctly.

**[34:33]**  Absolutely. It's a key system-level trade-off to manage.

**[34:36]**  Okay, we've covered the mechanics, the strategy, the risks. Let's bring it home with the AEO action

**[34:41]**  playbook. For the executive listening, what are the specific actionable steps their teams need to

**[34:47]**  deploy based on everything we've discussed? What's the implementation flow look like?

**[34:51]**  It really breaks down into a clear three-pronged flow designed to capture that high intent

**[34:57]**  traffic we talked about. Research, on-site engineering, and off-site citation.

**[35:01]**  Okay, step one. Research.

**[35:03]**  One, question research. You need to shift from just keyword research to question research.

**[35:09]**  Start by taking your traditional high-value paid search terms, your competitors' money keywords,

**[35:14]**  and transform them into natural language questions. Use AI for that.

**[35:18]**  You can definitely use LLMs to help brainstorm question variations, but the real strategic

**[35:23]**  goal is mining your internal data sources. Dig into transcripts from sales calls,

**[35:28]**  analyze support tickets, look at questions asked in your community forums or doing webinars.

**[35:32]**  I am sure. Because those sources contain the unique, specific, long-tailed questions your

**[35:37]**  actual customers and prospects are asking, often in their own language.

**[35:41]**  These are the questions LLMs are now designed to answer, but they often don't show up clearly

**[35:45]**  in standard keyword research tools. Find those unique problems.

**[35:48]**  Okay, find the real questions. Step two.

**[35:51]**  Two, on-site strategy, content and structure. Once you have the target questions,

**[35:56]**  you need to create or optimize content to answer them directly.

**[35:59]**  Build targeted landing pages or help articles that answer the main question clearly

**[36:04]**  and address all the logical follow-up questions or sub-topics someone might have.

**[36:08]**  And structure is key here.

**[36:10]**  Structure is paramount.

**[36:11]**  Implement that clear, concise, structured Q&A format we discussed.

**[36:15]**  Use headings, lists, maybe tables. Make it dead simple for the AI to parse and extract the answer.

**[36:21]**  And crucially, enforce your internal linking strategy here.

**[36:25]**  Connect these answer papers back to relevant future pages, hub pages, and related questions,

**[36:29]**  using that consistent descriptive anchor text to reinforce your entity map.

**[36:33]**  Got it. Research, on-site. Step three.

**[36:37]**  Off-site strategy, citation optimization.

**[36:41]**  This is about actively building those valuable citations across different platforms.

**[36:46]**  It likely requires a multi-tiered approach based on your budget, resources, and tolerance for

**[36:51]**  control versus effort. Give us the tiers.

**[36:54]**  Okay, maybe think of it like this. High control, high cost.

**[36:58]**  If the budget allows and the terms are valuable enough, you can pursue paid partnerships.

**[37:02]**  Pay high authority tier one media sites or relevant affiliate publishers,

**[37:06]**  like those .dash-maradeth properties, to feature your brand, product, or perspective in their content,

**[37:12]**  essentially buying high-quality citations.

**[37:14]**  Okay, direct payment for placement.

**[37:16]**  Exactly. Then there's medium control, lower cost, but higher effort.

**[37:20]**  This is where that niche B2B video strategy comes in.

**[37:23]**  Identify those obscure but high-value technical questions or keywords where there's

**[37:27]**  literally no video competition. Create high-quality YouTube or Vimeo videos

**[37:32]**  answering them directly. If you're the only relevant video, you win that citation almost by default.

**[37:37]**  High leverage if you can execute well.

**[37:38]**  Makes sense. And the last tier.

**[37:40]**  Low control, potentially high-value requires authenticity.

**[37:44]**  This is deploying that authentic Reddit or Quora or relevant forum strategy.

**[37:48]**  It's lower control because you can't dictate outcomes, but potentially very high-value if done right.

**[37:54]**  Have your experts use real accounts, identify themselves appropriately,

**[37:57]**  find relevant threads where people are asking questions you can answer,

**[38:00]**  and provide genuinely useful high-quality responses.

**[38:03]**  Focus on being helpful first, expert second, marketer, maybe a distant third, if at all.

**[38:08]**  Build authority through contribution.

**[38:11]**  Okay, a clear three-step process. Research, onsite, offsite.

**[38:15]**  Now measurement, we talked about answer tracking tools. How do we use them effectively?

**[38:18]**  And critically, how do we validate that these actions are actually working

**[38:21]**  and not just random correlation?

**[38:23]**  Right. The validation part is key.

**[38:25]**  First, yes, embrace answer tracking tools as your core AEO metric.

**[38:29]**  Move beyond just tracking blueling rankings.

**[38:31]**  Focus on share of voice, how often are you sighted, how prominently,

**[38:35]**  and track your average rank or position within the AI summaries.

**[38:38]**  Monitor this across multiple AI surfaces important to your audience.

**[38:42]**  But tracking alone doesn't prove causation.

**[38:45]**  You mentioned experiment design earlier.

**[38:47]**  This feels critical for an executive needing ROI proof.

**[38:51]**  Absolutely critical.

**[38:52]**  The executive must mandate rigorous experiment design.

**[38:55]**  Honestly, so much AEO best practice advice online right now is anecdotal,

**[38:59]**  based on one person's limited experience or just plain wrong and unreproducible.

**[39:04]**  You need to fight that with data.

**[39:05]**  So proper A-B testing.

**[39:07]**  Proper A-B testing applied to AEO tactics.

**[39:10]**  Here's a simple framework.

**[39:12]**  Define a control group.

**[39:13]**  Select a set of say 100 target questions or topics where you will intentionally take no new AEO action.

**[39:19]**  Track their baseline, share of voice over time.

**[39:22]**  Define a test group.

**[39:23]**  Select a separate but comparable set of 100 questions.

**[39:26]**  Implement one specific AEO variable for this group, for example.

**[39:29]**  Create and publish new YouTube videos, specifically targeting these 100 questions.

**[39:33]**  Or run a focused Reddit outreach campaign,

**[39:35]**  answering threads related to them.

**[39:37]**  Or implement a specific schema markup on the corresponding pages.

**[39:41]**  One variable at a time.

**[39:42]**  One variable at a time.

**[39:44]**  Then, track the change in share of voice for the test group relative to the control group

**[39:48]**  over a statistically significant period.

**[39:50]**  Did the group where you added videos see a measurable lift compared to the group where you did nothing?

**[39:55]**  That gives you actual evidence of efficacy.

**[39:58]**  Exactly.

**[39:58]**  It helps determine true efficacy and crucially reproducibility.

**[40:02]**  If you run the experiment again with a different set of questions and get a similar result,

**[40:07]**  then you have a strategy you can confidently invest in and scale.

**[40:11]**  Without this kind of rigorous testing, you're just guessing.

**[40:14]**  Hashtag tag tag 4.3, team structure, organizational risk.

**[40:18]**  Okay.

**[40:18]**  Last piece of the playbook.

**[40:20]**  Team structure.

**[40:21]**  This sounds like it requires different skills than traditional SEO,

**[40:25]**  who actually does this work internally.

**[40:27]**  And what are the organizational risks if we get the structure wrong?

**[40:30]**  This is a major organizational challenge,

**[40:32]**  and you're right, the skill set required has fundamentally split.

**[40:35]**  The executive needs to recognize this bifurcation and the risk of misalignment

**[40:40]**  if it's not structured properly.

**[40:41]**  How should it be split, ideally?

**[40:43]**  Broadly, you can think of it this way.

**[40:45]**  Your existing SEO team should likely retain ownership

**[40:48]**  of the traditional SEO fundamentals and the on-site AEO components.

**[40:52]**  That means technical site health,

**[40:54]**  optimizing landing pages for extraction,

**[40:57]**  implementing structured data, schema, and critically,

**[41:00]**  the rigorous work of building and maintaining that internal entity map

**[41:04]**  through strategic internal linking.

**[41:06]**  Their focus is technical precision and site architecture.

**[41:08]**  Their KPIs might be technical health scores,

**[41:11]**  schema validation rates, maybe an entity map accuracy score.

**[41:15]**  Exactly.

**[41:16]**  Then you need a separate focus, likely within the marketing or community team,

**[41:19]**  to handle the off-site citation optimization piece.

**[41:23]**  This involves the UGC outreach on platforms like Reddit,

**[41:26]**  producing that new video content,

**[41:28]**  and managing relationships with affiliates or tier one media for paid placements.

**[41:32]**  And these are very different skills, right?

**[41:33]**  Community engagement, video production, relationship management,

**[41:36]**  not typically core SEO skill.

**[41:38]**  Very different.

**[41:39]**  This team needs expertise and authentic communication,

**[41:43]**  content creation for different formats,

**[41:45]**  video, social, and potentially partnership management.

**[41:49]**  Their KPIs would be things like citation velocity,

**[41:52]**  positive mentions and target communities,

**[41:54]**  and contribution to the overall share of voice metric

**[41:57]**  tracked by the answer tracking tools.

**[41:59]**  So the big organizational risk is?

**[42:01]**  The risk is misalignment or lack of communication between these two functions.

**[42:06]**  The SEO team could build the most technically perfect semantic

**[42:10]**  architecture on the website,

**[42:11]**  defining all the entities beautifully.

**[42:14]**  But if the marketing community team isn't aligned,

**[42:16]**  if they don't understand which entities need external validation,

**[42:20]**  they might just generate random citations or focus on the wrong platforms.

**[42:23]**  Their off-site efforts won't effectively reinforce the on-site entity map

**[42:28]**  that the SEO team built for the air-A-G system.

**[42:30]**  So the two gears don't mesh?

**[42:32]**  Precisely.

**[42:33]**  They have to work in concert.

**[42:34]**  Leadership's role is to establish clear goals,

**[42:37]**  shared metrics like overall share of voice,

**[42:39]**  and a strong communication loop.

**[42:41]**  The SEO team needs to clearly communicate.

**[42:43]**  These are the priority entities we need the outside world to validate,

**[42:47]**  and the marketing community team needs to execute targeted off-site strategies

**[42:50]**  to get high-quality relevant citations for those specific entities.

**[42:55]**  Hashtag tag outro.

**[42:56]**  Okay, that brings us to the end of this deep dive.

**[42:59]**  So wrapping this all up for you,

**[43:00]**  the technical executive trying to navigate this shift.

**[43:03]**  What's the single biggest strategic takeaway?

**[43:06]**  I think the key takeaway is this.

**[43:08]**  AEO isn't just a simple replacement for SEO.

**[43:11]**  It's a fundamental evolution.

**[43:13]**  It demands much more system-level thinking,

**[43:15]**  way more precision and execution,

**[43:17]**  and a strategic shift in focus.

**[43:19]**  The old game-rewarded volume of links

**[43:21]**  and writing that Hashtag one spot.

**[43:23]**  Right.

**[43:23]**  The new game rewards demonstrating deep, high-quality,

**[43:26]**  well-structured entity authority.

**[43:28]**  And it rewards building a diversified citation strategy

**[43:31]**  across multiple surfaces, not just Google Search.

**[43:34]**  So you, our listener, should now hopefully understand

**[43:36]**  the raw mechanics behind this.

**[43:39]**  Winning an AEO means getting your content, your brand,

**[43:42]**  your perspective, cited frequently and accurately

**[43:45]**  by that RGR context we discussed.

**[43:47]**  And you understand why Argary rewards that.

**[43:50]**  It needs structured, clear, human-vetted,

**[43:52]**  diverse content sources that build a coherent,

**[43:56]**  semantic graph of your expertise.

**[43:58]**  And all that technical effort,

**[43:59]**  all that focus on structure and citations,

**[44:02]**  it leads directly to that significantly higher-quality,

**[44:05]**  pre-qualified prime traffic.

**[44:07]**  Traffic that converts at rates that can fundamentally change

**[44:10]**  your business economics.

**[44:11]**  The complexity up front is absolutely worth the precision

**[44:14]**  and the payoff downstream.

**[44:16]**  That knowledge is powerful.

**[44:17]**  Okay.

**[44:17]**  Let's leave you with one final, maybe provocative thought

**[44:20]**  to mull over.

**[44:21]**  Go for it.

**[44:21]**  Right now, everyone's focused on getting cited.

**[44:24]**  And maybe getting that high intent

**[44:25]**  click from the citation and the AI answer.

**[44:27]**  But what's the ultimate AEO end game?

**[44:29]**  Interesting question.

**[44:31]**  Could it be influencing the AI to make decisions autonomously

**[44:34]**  on your behalf?

**[44:35]**  Perhaps without needing any click out at all?

**[44:38]**  Whoa, like what?

**[44:39]**  Imagine future AI agents,

**[44:41]**  maybe embedded in operating systems or personal assistance

**[44:44]**  that are tasked with booking services,

**[44:47]**  selecting software vendors, recommending products,

**[44:50]**  based purely on the conversational context

**[44:52]**  and the perceived authority and trustworthiness

**[44:54]**  established by your long-term AEO efforts.

**[44:57]**  The AI makes the choice for the user.

**[45:00]**  So the conversion happens entirely within the AI based on your

**[45:03]**  established digital authority with zero friction,

**[45:06]**  zero clicks needed.

**[45:08]**  Potentially.

**[45:09]**  So the final question for you is,

**[45:10]**  what does your company's current digital footprint,

**[45:13]**  your entity authority, your citation profile look like today,

**[45:16]**  if the decision is made for the user,

**[45:18]**  based purely on the AI's internal assessment?

**[45:20]**  That might be the next frontier of optimization

**[45:23]**  we need to start thinking about.

**[45:24]**  And honestly, it's probably already starting to happen

**[45:26]**  in subtle ways.

