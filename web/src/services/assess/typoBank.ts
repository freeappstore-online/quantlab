import { TYPO_TEMPLATES_B } from './typoBankB';

export type TypoGenre = 'email' | 'about' | 'ceo' | 'notice' | 'event';

export interface TypoTemplate {
  genre: TypoGenre;
  /**
   * Plain text with error slots. A slot is switched on at random and shows the wrong form.
   *   {m:word}        misspelling (made automatically; {m:word=wrong} gives the wrong form)
   *   {s:word}        stray keystroke
   *   {h:right/wrong} wrong word or homophone ("wrong" may list several, comma separated)
   *   {a:right/wrong} apostrophe error
   *   {c:Name}        proper noun that loses its capital letters
   *   word{p}         full stop missing before the next capitalised sentence
   *   word{d}         the word is repeated
   * Blank lines start a new paragraph.
   */
  text: string;
}

const A: TypoTemplate[] = [
  {
    genre: 'email',
    text: `Subject: Quarterly review follow-up

Hi {c:Priya},

I wanted to follow up on {h:our/hour} conversation from Tuesday{p} Thank you for {m:accepting} the invitation to {m:present} at the client meeting{p} {s:Your} {m:feedback} on the draft was {m:extremely} helpful and I {m:appreciate} it.

{h:There/Their} are a few {m:outstanding} items to resolve before we {m:finalise} the report{p} First, the {m:financial} summary needs {h:its/it's} figures {m:updated} to match the latest invoices{p} Second, the appendix should {m:include} a short note on {h:whether/weather} the forecast {h:affects/effects} {a:next year's/next years} budget.

I would also {m:recommend} that we {m:schedule} a {h:quiet/quite} review session on Friday{p} The {a:team's/teams} {m:availability} is limited, so please {h:accept/except} the invite as soon as you can.

{m:Thanks} again for all your {m:hard} work. I am {h:quite/quiet} {m:confident} we can {m:deliver} a strong result{d} next week.

I have attached the latest figures{p} Please {m:review} them {m:carefully} and let me know if anything looks {m:unusual}{p} {h:It's/Its} easier to {m:correct} a mistake {m:early} than to {m:explain} it {m:later}.

Kind regards,
{c:Daniel Whitmore}
{c:Brightwater Advisory}`,
  },
  {
    genre: 'email',
    text: `Subject: Delay to the website project

Dear {c:Ms Okafor},

I am writing to {m:update} you on the {m:progress} of the website project{p} Unfortunately, we {m:expect} a short {m:delay} of about two weeks{p} {h:It's/Its} caused by a problem with {h:our/are} {m:hosting} provider, which {h:led/lead} to the loss of some test data.

We {m:apologise} for any {m:inconvenience} this may cause{p} The {a:developers/developer's} have already {m:restored} most of the files and are {m:working} to {m:complete} the rest by Monday.

In the {m:meantime}, I would {m:suggest} that you {m:review} the {m:revised} {m:timeline} attached to this email{p} If you have any {m:concerns}, please do not {m:hesitate} to {m:contact} me{d} directly.

{h:We/Wee} {m:value} your {m:patience} and {m:understanding}. Our {m:priority} is to {m:deliver} a site that {m:reflects} the {m:quality} you {m:expect} from {c:Northgate Digital}.

{s:Our} {m:records} {m:show} that the {m:previous} {m:request} was {m:handled} {m:promptly}{p} {h:There/Their} should be no {m:further} {m:delay}, but I will {m:confirm} {m:once} the {m:details} are {m:final}.

Yours sincerely,
{c:Helen Marsh}
Project Manager`,
  },
  {
    genre: 'email',
    text: `Subject: Request for budget approval

Hi {c:Tomas},

I would like to {m:request} approval for an additional budget of four thousand pounds{p} The money would {m:cover} the cost of new laptops for the {m:graduate} intake{p} {h:Their/There} current machines are {m:several} years old and often {m:struggle} to run the {m:required} software.

I have {m:compared} quotes from three {m:suppliers} and {m:recommend} the {m:second} option{p} It offers the {m:longest} warranty and {m:includes} free {m:delivery}. The {m:cheapest} quote does not {m:include} {h:its/it's} own support contract, which would {h:affect/effect} us {m:later}.

Please let me know {h:whether/weather} you need {m:further} detail{p} I can {m:prepare} a one page summary for the {a:finance team's/finance teams} meeting on {c:Thursday}.

If we {m:approve} the order this week{d} the {m:equipment} should {m:arrive} before the new starters {m:join} in {c:September}. I would be {m:grateful} for a reply by {m:Wednesday}.

If you {m:prefer}, we can {m:discuss} this by {m:telephone}{p} I am {m:available} {m:most} {m:afternoons}, and I will {h:accept/except} any time that {m:suits} you.

{m:Thanks} for your {m:support},
{c:Amelia Burrows}
{c:Harbourside Consulting}`,
  },
  {
    genre: 'email',
    text: `Subject: Welcome to the team

Dear {c:Jordan},

On behalf of everyone at {c:Kestrel Logistics}, I would like to {m:welcome} you to the {m:company}{p} We are {m:delighted} that you have {m:accepted} our offer and we {m:look} forward to {m:working} with you.

Your first day will {m:begin} at nine o'clock at our {c:Riverside Office}{p} Please {m:bring} a form of {m:identification} and your {m:signed} contract{p} {s:Your} {m:manager}, {c:Sophie Grant}, will meet you at {h:reception/receptions} and {m:introduce} you to the team.

{h:There/Their} will be a short {m:induction} in the {m:morning}, followed by lunch with {h:your/you're} new {m:colleagues}{p} In the {m:afternoon} you will {m:receive} your laptop and {m:access} to the {m:company} systems.

We {m:understand} that starting a new job can be {m:daunting}, so please {m:remember} that no question is too small{d} to ask. {h:It's/Its} important to us that you feel {m:comfortable} from the {m:beginning}.

The {a:department's/departments} {m:budget} is {m:tight} this {m:quarter}{p} {m:Therefore}, I would {m:appreciate} your {m:help} in {m:keeping} {m:costs} {m:under} {m:control}{d} wherever {m:possible}.

Best {m:wishes},
{c:Marcus Doyle}
{c:People Team}`,
  },
  {
    genre: 'email',
    text: `Subject: Actions from Monday's meeting

Hello {c:everyone}{p}

Thank you all for {m:attending} the planning meeting on Monday{p} I have {m:summarised} the main {m:decisions} below so that we are {m:clear} about who is {m:responsible} for each task.

First, {c:Leila} will {m:prepare} the {m:customer} survey and send it to the {m:marketing} team by Friday{p} Second, {c:Oliver} will {m:contact} the {m:printers} to {m:confirm} {h:their/there} delivery dates{p} Third, the {a:sales team's/sales teams} {m:targets} must be {m:reviewed} before we {m:publish} the {m:final} plan.

{h:It's/Its} {m:important} that we {m:avoid} any further {m:delays}, as the launch date will not {m:change}{p} If anyone {m:expects} a problem, please {m:tell} me as soon as {m:possible} so that we can {h:accept/except} the {m:risk} and {m:agree} a new {m:approach}.

The next meeting will be {m:held} in the {m:boardroom} at ten o'clock{d} on Monday. {s:Please} {m:bring} your {m:updates} and any {m:questions}.

I {m:realise} that this is a {m:busy} {m:period}, so I am {m:grateful} for the {m:time} you have {m:already} {m:given}{p} Your {m:advice} {m:continues} to be {m:invaluable}.

{m:Regards},
{c:Natalie Brooks}`,
  },
  {
    genre: 'email',
    text: `Subject: Reply to your complaint about the delivery

Dear {c:Mr Kowalski},

Thank you for {m:contacting} us about the {m:damaged} furniture that {m:arrived} on {c:Tuesday}{p} I was very sorry to {m:hear} that the table {m:arrived} with a {m:cracked} leg and that {h:your/you're} {m:delivery} was also late.

I have {m:spoken} to our {m:courier} and they have {m:accepted} {h:their/there} {m:responsibility}{p} We will {m:arrange} for a {m:replacement} table to be {m:delivered} to your home free of charge{p} The new table will {m:arrive} within five working days.

I would also like to {m:offer} you a discount of twenty per cent on your next {m:order}{p} I hope this goes some way to {m:rectify} the {m:problem} and {m:restore} your {m:confidence} in {c:Oakfield Home Interiors}.

{h:It's/Its} our {m:policy} to {m:inspect} every item before it {m:leaves} the {m:warehouse}, so I will also {m:investigate} how this {m:mistake} was {m:missed}{p} The {a:warehouse team's/warehouse teams} {m:manager} will {m:contact} you if we {m:discover} anything {m:further} to{d} report.

Yours {m:sincerely},
{c:Rachel Ince}
Customer {m:Service} Manager`,
  },
  {
    genre: 'email',
    text: `Subject: Training schedule for next month

Hi {c:all},

The {m:training} schedule for {c:November} is now {m:confirmed}{p} Please {m:read} the details {m:carefully} and let me know if you {m:cannot} attend any of the {m:sessions}.

On the {m:second} Monday, {c:Imran Shah} will lead a {m:workshop} on {m:presentation} skills{p} {h:There/Their} will be time for {m:practice} and {m:feedback}, so please {m:prepare} a five minute talk on a topic of your {m:choice}{p} The {m:session} will take {m:place} in the {c:Maple Room}.

On the {m:following} Thursday, {c:Grace Lin} will {m:explain} the new {m:expenses} system{p} It is {m:designed} to {m:reduce} errors and {m:speed} up {m:payments}{p} {h:It's/Its} {m:compulsory} for anyone who {m:claims} travel costs, and it will {h:affect/effect} all {m:departments}.

Lunch will be {m:provided} on both days{p} Please {m:inform} me of any {m:dietary} {m:requirements} by the end of this week{d} so that I can {m:order} in good time.

I look {m:forward} to seeing {h:you/you're} all there.

I have attached the latest figures{p} Please {m:review} them {m:carefully} and let me know if anything looks {m:unusual}{p} {h:It's/Its} easier to {m:correct} a mistake {m:early} than to {m:explain} it {m:later}.

{m:Thanks},
{c:Aisha Rahman}
{c:Learning Team}`,
  },
  {
    genre: 'email',
    text: `Subject: Our apology and your refund

Dear {c:Mrs Dunmore},

I am {m:writing} to {m:apologise} for the {m:problems} you {m:experienced} with your {m:recent} booking at the {c:Lakeview Hotel}{p} Our {m:records} show that you were {m:charged} twice for the same {m:stay}{p} {h:It's/Its} a {m:serious} {m:error} and we are {m:sorry} for the {m:stress} it caused.

I have {m:asked} our {m:accounts} team to {m:refund} the extra payment in {m:full}{p} The money should {m:appear} in your account within three working days{p} You will also {m:receive} a {m:written} {m:confirmation} by email.

As a {m:gesture} of {m:goodwill}, we would like to {m:offer} you a free {m:night} on your next visit{p} {h:There/Their} are no {m:conditions}, and the {m:voucher} is {m:valid} for twelve months{p} Please {h:accept/except} it with our {m:compliments}.

We {m:take} {a:guests'/guests} {m:complaints} very seriously{p} {s:Our} {a:team's/teams} {m:training} has been {m:updated} to {m:prevent} this from {m:happening} again{d} in the future.

{s:Our} {m:records} {m:show} that the {m:previous} {m:request} was {m:handled} {m:promptly}{p} {h:There/Their} should be no {m:further} {m:delay}, but I will {m:confirm} {m:once} the {m:details} are {m:final}.

{m:Yours} {m:faithfully},
{c:David Penrose}
{c:Guest Relations}`,
  },
];

export const TYPO_TEMPLATES: TypoTemplate[] = [...A, ...TYPO_TEMPLATES_B];
