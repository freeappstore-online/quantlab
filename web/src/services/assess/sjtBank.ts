export type SjtTheme = 'deadline' | 'client' | 'ethics' | 'team' | 'clarity' | 'growth' | 'inclusion' | 'customer' | 'collab' | 'impact' | 'data';
export type SjtTag = 'ownership' | 'integrity' | 'client' | 'escalation' | 'communication' | 'learning' | 'inclusion' | 'impact' | 'responsibility';

export const SJT_TAG_LABEL: Record<SjtTag, string> = {
  ownership: 'Ownership',
  integrity: 'Integrity',
  client: 'Client focus',
  escalation: 'Escalating appropriately',
  communication: 'Communication',
  learning: 'Growth mindset',
  inclusion: 'Inclusion',
  impact: 'Making an impact',
  responsibility: 'Responsible technology',
};

export const SJT_THEME_LABEL: Record<SjtTheme, string> = {
  deadline: 'Missed deadline',
  client: 'Client complaint',
  ethics: 'Ethical issue',
  team: 'Team conflict',
  clarity: 'Unclear instructions',
  growth: 'Learning from feedback',
  inclusion: 'Inclusive teamwork',
  customer: 'Customer first',
  collab: 'Working across teams',
  impact: 'Taking initiative',
  data: 'Responsible data and AI',
};

export interface SjtOption {
  text: string;
  tag: SjtTag;
  /** Why the option sits where it does in the expert ranking. */
  why: string;
}

export interface SjtScenario {
  id: string;
  theme: SjtTheme;
  situation: string;
  /** In expert order: index 0 is the most effective response, index 3 the least. */
  options: [SjtOption, SjtOption, SjtOption, SjtOption];
}

export type Row = [string, SjtTag, string];
export const sc = (id: string, theme: SjtTheme, situation: string, o: [Row, Row, Row, Row]): SjtScenario => ({
  id,
  theme,
  situation,
  options: o.map(([text, tag, why]): SjtOption => ({ text, tag, why })) as SjtScenario['options'],
});

export const SJT_SCENARIOS: SjtScenario[] = [
  // ------------------------------------------------------------------ Missed deadlines
  sc('d1', 'deadline', 'On Monday you realise the slide pack due to your manager on Friday will be late, because a data source you rely on has been delayed.', [
    ['Tell your manager today, explain the delay, propose a revised plan and offer whatever you can deliver on time.', 'communication', 'Early, honest notice with a workable plan lets your manager adjust and shows you are managing the problem.'],
    ['Work extra hours to catch up and only tell your manager if you still miss the deadline.', 'ownership', 'It shows commitment, but hiding the risk takes away your manager’s chance to help or reset expectations.'],
    ['Ask a teammate to quietly finish part of the analysis so the deadline is met.', 'communication', 'Using colleagues can be sensible, but doing it silently hides the problem and blurs who did what.'],
    ['Submit on Friday with the missing figures estimated and say nothing.', 'integrity', 'Presenting estimates as facts misleads the reader and puts your credibility at risk.'],
  ]),
  sc('d2', 'deadline', 'A client report and an internal training module are both due on Thursday. You cannot finish both properly.', [
    ['Tell your manager about the clash, suggest a plan and ask which should take priority.', 'escalation', 'Priorities across clients and internal work are a shared decision, so raising it early lets the right person decide.'],
    ['Finish the client report first, then tell the training lead you will be late and give a new date.', 'client', 'Protecting the client deliverable is sensible, and you communicate the slip, but you made the call alone.'],
    ['Do rushed versions of both and hope nobody notices the lower quality.', 'integrity', 'Quietly lowering quality on both is a poor trade-off and leaves people relying on weak work.'],
    ['Do the training first because it is easier and mention the client report later.', 'ownership', 'Choosing by convenience, and delaying bad news about the client report, puts the most important work at risk.'],
  ]),
  sc('d3', 'deadline', 'A colleague is ill on a deadline day and asks you to cover some of their tasks, but your own day is already full.', [
    ['Work out what you can realistically take on, agree priorities with your manager and tell your colleague exactly what will be covered.', 'communication', 'You help the team while being honest about capacity and keeping everyone clear on what will and will not happen.'],
    ['Take all their tasks and stay late without telling anyone.', 'ownership', 'Generous, but overcommitting in silence risks missing your own work and hides the real workload problem.'],
    ['Politely decline because you are busy and suggest they ask someone else.', 'communication', 'Saying no clearly is fair, but you missed the chance to help find a solution for the team.'],
    ['Ignore the message and carry on with your own work.', 'ownership', 'Leaving a request unanswered lets a teammate down and delays the team finding cover.'],
  ]),
  sc('d4', 'deadline', 'You finish a report a day early, then spot a small error that would take two hours to fix. The deadline is tomorrow.', [
    ['Fix the error, check the rest, submit on time and note the correction.', 'ownership', 'You deliver on time and take responsibility for quality, with a clear record of what changed.'],
    ['Submit now and point out the small error in your email so the reviewer is aware.', 'integrity', 'Being open about the known error is honest, but you could easily have fixed it first.'],
    ['Delay submission by a week to make it perfect without telling anyone.', 'communication', 'The pursuit of perfection is understandable, but missing the deadline silently affects people waiting for it.'],
    ['Submit it and hope the error is not noticed.', 'integrity', 'Knowingly sending work with an error you have not disclosed undermines trust.'],
  ]),
  sc('d5', 'deadline', 'Your manager gives you an urgent extra task while you are halfway through a priority piece of work for a client.', [
    ['Show your manager your current workload, ask which takes priority and agree a plan.', 'communication', 'A short, factual conversation lets your manager make the trade-off with full information.'],
    ['Accept the task and plan to get both done by working late.', 'ownership', 'Willing, but you risk quality and a missed deadline without anyone knowing there is a conflict.'],
    ['Finish the client work first, then start the urgent task without mentioning it.', 'client', 'Protecting the client is reasonable, but your manager thinks the urgent task is already underway.'],
    ['Tell your manager you cannot take it because you are too busy.', 'communication', 'Flatly refusing without offering options or context is unhelpful and can look uncooperative.'],
  ]),
  sc('d6', 'deadline', 'You miss an internal deadline because you underestimated the work. Nobody has asked about it yet.', [
    ['Tell your manager straight away, apologise briefly, give a new date and explain how you will estimate better.', 'ownership', 'Owning the mistake, resetting expectations and learning from it is what builds trust.'],
    ['Send the report as soon as it is finished with a short apology.', 'communication', 'Apologising is good, but people were waiting without knowing when it would arrive.'],
    ['Wait to see whether anyone notices before saying anything.', 'integrity', 'Waiting to be caught avoids responsibility and lets problems grow.'],
    ['Blame a late input from a colleague in your email.', 'integrity', 'Shifting blame damages relationships and credibility, and it does not fix the problem.'],
  ]),

  // ------------------------------------------------------------------ Client complaints
  sc('c1', 'client', 'A client emails to say figures in your report do not match their own records. They sound upset.', [
    ['Acknowledge promptly and apologise, check the figures, tell your manager and update the client with what you find.', 'client', 'A fast, courteous reply, real investigation and a visible follow-up protect the relationship and the facts.'],
    ['Forward the email to your manager and wait for instructions.', 'escalation', 'Involving your manager is right, but leaving the client with no reply in the meantime feels like no one is in charge.'],
    ['Reply defending the report without checking the numbers.', 'integrity', 'Defending work before verifying it can turn a small error into a larger loss of trust.'],
    ['Wait to see whether the client chases.', 'ownership', 'Ignoring a complaint signals indifference and lets the issue escalate.'],
  ]),
  sc('c2', 'client', 'A client tells you your team promised a call back two days ago and never made it. They are thinking of leaving.', [
    ['Call them promptly, apologise, find out what they need, agree a clear next step and keep your manager informed.', 'client', 'Speaking directly and agreeing specific actions repairs trust faster than anything written.'],
    ['Send an apologetic email and promise it will not happen again.', 'communication', 'The apology is good, but an email with a general promise does little to solve their immediate need.'],
    ['Ask a colleague who knows the client to ring them instead.', 'escalation', 'Handing over can help, but you were contacted and should at least own the reply.'],
    ['Explain that the team was busy and the client could have chased.', 'client', 'Putting the responsibility on the client ignores the failure and damages the relationship further.'],
  ]),
  sc('c3', 'client', 'A client demands a feature that is outside the agreed scope and threatens to complain to your director.', [
    ['Listen, explain what is in scope, offer options such as a change request and tell your manager what has happened.', 'client', 'You take the concern seriously, stay honest about scope and keep your manager aware of the risk.'],
    ['Say you will check with your manager and come back to them within a day.', 'escalation', 'Appropriate escalation and a clear timeline, though you offer no options or context yet.'],
    ['Refuse and point to the contract without discussion.', 'client', 'It is accurate but rigid, and it treats a worried client as an opponent.'],
    ['Agree to build it to keep them happy and sort out the cost later.', 'integrity', 'Promising work outside scope without authority creates cost, delays and an unrealistic precedent.'],
  ]),
  sc('c4', 'client', 'A client is rude to a junior colleague during a call and your colleague is upset afterwards.', [
    ['Check on your colleague, raise it with your manager and agree how to address the client’s behaviour professionally.', 'escalation', 'You support your colleague and use the right route for dealing with the client relationship.'],
    ['Tell your colleague to ignore it because difficult clients are normal.', 'communication', 'It plays down a real concern, though it offers a little reassurance.'],
    ['Email the client to complain about their behaviour and copy in your boss.', 'client', 'A public, emotional reply risks the relationship and bypasses the proper conversation.'],
    ['Say nothing and hope it does not happen again.', 'ownership', 'Doing nothing leaves your colleague unsupported and allows the problem to repeat.'],
  ]),
  sc('c5', 'client', 'You discover that a client was overcharged by £500 on an invoice sent last month.', [
    ['Tell your manager, correct the invoice and tell the client about the error with an apology and the refund.', 'integrity', 'Open correction builds long-term trust and keeps the right people informed.'],
    ['Correct the invoice and refund the client quietly without explaining.', 'communication', 'The money goes back, but the client is not told what happened and may be confused.'],
    ['Wait to see whether the client notices.', 'integrity', 'Knowing about an overcharge and waiting to be caught is not honest dealing.'],
    ['Leave it because the amount is small.', 'integrity', 'The size does not matter: overcharging a client is a breach of trust whatever the amount.'],
  ]),
  sc('c6', 'client', 'At 5.30pm on a Friday a client sends an urgent request for something you are not responsible for. You are about to leave.', [
    ['Reply to confirm receipt, find out how urgent it really is and hand it to the right colleague with a clear note.', 'client', 'The client knows it has been received and the right person has the context to act.'],
    ['Forward it to the account manager and leave, assuming they will pick it up.', 'escalation', 'Passing it on is correct, but no acknowledgement and no handover note leaves room for it to be missed.'],
    ['Promise the client you will finish it tonight, even though you are unsure how.', 'integrity', 'Over-promising to please someone sets up a bigger failure later.'],
    ['Leave it until Monday because it is not your job.', 'ownership', 'Doing nothing means an urgent request may sit unseen all weekend.'],
  ]),

  // ------------------------------------------------------------------ Ethical issues
  sc('e1', 'ethics', 'You notice a colleague repeatedly claiming expenses for taxi journeys that appear to be personal.', [
    ['Raise your concern confidentially through your manager or the firm’s reporting channel, giving specific examples.', 'integrity', 'Policy breaches should go through the proper route, with facts rather than assumptions.'],
    ['Speak to your colleague privately and ask them to correct it before deciding whether to report.', 'communication', 'It gives them a chance to put it right, but if they do not you still need to report it.'],
    ['Do nothing, as it is not your business.', 'ownership', 'Staying silent allows a potential policy breach to continue.'],
    ['Mention it to other colleagues to see what they think.', 'integrity', 'Gossip harms reputations and does nothing to resolve the issue properly.'],
  ]),
  sc('e2', 'ethics', 'A client accidentally sends you confidential data that belongs to another company.', [
    ['Stop reading, tell the sender and your manager, and delete it in line with your data policy.', 'integrity', 'Prompt disclosure and proper handling protect both companies and your firm.'],
    ['Tell your manager but keep a copy in case it becomes useful.', 'integrity', 'Telling your manager is right, but keeping data you were not meant to have is not.'],
    ['Look at it briefly to decide whether it is relevant before telling anyone.', 'ownership', 'Reading it first deepens the breach and delays reporting.'],
    ['Use the information in your own analysis because it is already in your inbox.', 'integrity', 'Using information you know was sent in error is unethical and could breach confidentiality duties.'],
  ]),
  sc('e3', 'ethics', 'Your manager asks you to adjust a figure in a report so that it meets the quarterly target.', [
    ['Decline politely, explain the figure is accurate, offer to show the data and suggest explaining the gap.', 'integrity', 'You stay honest while offering a constructive alternative that deals with your manager’s concern.'],
    ['Raise the request with compliance or a senior leader.', 'escalation', 'Appropriate if the conversation fails, but you skipped the chance to resolve it directly first.'],
    ['Make the change but keep a note of the request and your concerns.', 'integrity', 'Keeping a record helps you, but you still falsified a number.'],
    ['Change the figure and say nothing.', 'integrity', 'Altering results to hit a target is dishonest and could have serious consequences.'],
  ]),
  sc('e4', 'ethics', 'After you award a contract, the supplier offers you a £200 gift voucher as a thank-you.', [
    ['Politely decline, tell your manager and record the offer in line with the gifts policy.', 'integrity', 'Declining and declaring protects you and the firm from any appearance of bias.'],
    ['Accept it but declare it to your manager afterwards.', 'integrity', 'Declaring is good, but accepting a gift tied to a decision you made creates a conflict.'],
    ['Accept it and share it among the team.', 'communication', 'Sharing does not remove the fact that a supplier is rewarding a contract decision.'],
    ['Accept it and say nothing.', 'integrity', 'Hiding a gift from a supplier you have just awarded work to is a serious integrity breach.'],
  ]),
  sc('e5', 'ethics', 'You realise you have emailed a draft containing client names to the wrong external recipient.', [
    ['Tell your manager or the data protection lead immediately, ask the recipient to delete it and document what happened.', 'ownership', 'Quick reporting lets the firm contain the risk and meet its obligations.'],
    ['Email the recipient asking them to delete it and hope that is the end of it.', 'communication', 'Asking for deletion is useful, but nobody in the firm knows about the breach.'],
    ['Wait to see whether anyone notices.', 'integrity', 'Hoping a data breach goes unnoticed puts clients at risk and makes it worse if discovered.'],
    ['Say that the email program chose the wrong address if anyone asks.', 'integrity', 'Shifting blame does not fix the breach and damages trust in you.'],
  ]),
  sc('e6', 'ethics', 'A colleague asks to borrow your login to open a system they have not been given access to. It is urgent.', [
    ['Decline, explain why, and offer to help them request access through the proper process.', 'integrity', 'Credentials are personal, and you stay helpful by supporting the correct route.'],
    ['Agree this once and stand next to them while they use it.', 'ownership', 'Your supervision does not change the fact that you have bypassed access controls.'],
    ['Agree, then change your password afterwards.', 'ownership', 'It limits the damage later, but access has already been shared and the rule broken.'],
    ['Share your login without a second thought.', 'integrity', 'Sharing credentials without question is a clear breach of security rules.'],
  ]),

  // ------------------------------------------------------------------ Team conflict
  sc('t1', 'team', 'Two senior teammates disagree strongly about the approach and the project has stalled. You are the most junior member.', [
    ['Suggest a short meeting, listen to each view, summarise both and propose agreeing criteria; tell your manager if it stays stuck.', 'communication', 'You help the team move forward constructively and escalate if needed.'],
    ['Quietly side with the more senior person to move things along.', 'ownership', 'It may unblock the work but ignores the merits and can leave the other person unheard.'],
    ['Wait for them to sort it out themselves.', 'ownership', 'Doing nothing lets the delay continue and puts the deadline at risk.'],
    ['Complain about both of them to other colleagues.', 'communication', 'Gossip deepens the conflict and does not help the project.'],
  ]),
  sc('t2', 'team', 'A teammate regularly arrives late to meetings, and it is holding everyone up.', [
    ['Speak to them privately, describe the impact and ask whether something is making it hard.', 'communication', 'A respectful, specific conversation gives them a chance to understand and respond.'],
    ['Mention it to your manager in your next one-to-one without speaking to them first.', 'escalation', 'Raising it is valid, but skipping the direct conversation can feel like going behind their back.'],
    ['Make jokes about the lateness in meetings.', 'communication', 'Humour at their expense can embarrass them and does not address the cause.'],
    ['Ignore it and say nothing.', 'ownership', 'The team keeps losing time and the issue is never named.'],
  ]),
  sc('t3', 'team', 'In a planning meeting you disagree with the team lead’s approach, which you think will cause problems.', [
    ['Raise your concerns respectfully with evidence, listen to the response and support the final decision.', 'communication', 'Speaking up with facts helps the team decide, and committing to the outcome keeps the team united.'],
    ['Say nothing in the meeting but raise it privately with the lead afterwards.', 'communication', 'A good route, but the team missed hearing your input when it could have helped the decision.'],
    ['Go straight to the lead’s manager.', 'escalation', 'Going above before speaking to the lead undermines the relationship and skips the usual order.'],
    ['Quietly follow your own plan instead.', 'integrity', 'Working against the agreed plan without telling anyone creates confusion and mistrust.'],
  ]),
  sc('t4', 'team', 'A colleague takes credit for your analysis when presenting to the client.', [
    ['Calmly clarify your part at the time if it is natural to do so, then speak to your colleague privately about it.', 'communication', 'You protect the facts for the client and address the behaviour directly and professionally.'],
    ['Say nothing in the meeting but tell your manager afterwards.', 'escalation', 'It brings the issue to the right person, though a direct conversation might have settled it first.'],
    ['Correct them sharply in front of the client.', 'client', 'It makes the team look divided in front of the client.'],
    ['Stay silent and stop sharing your work with that colleague.', 'ownership', 'Withdrawing hurts collaboration and leaves the problem unresolved.'],
  ]),
  sc('t5', 'team', 'A new colleague is struggling, and others in the team are showing frustration.', [
    ['Offer to pair with them, share how you work, and let your manager know they could use support.', 'ownership', 'You help directly and make sure the right person knows about the support needed.'],
    ['Quietly take over some of their tasks to keep things on track.', 'ownership', 'Helpful in the short term, but they do not learn and the real need is hidden.'],
    ['Complain to the rest of the team about how slow they are.', 'communication', 'Criticising behind someone’s back damages the team and does not help them improve.'],
    ['Avoid working with them.', 'ownership', 'Avoidance leaves a new starter more isolated and the issue unsolved.'],
  ]),
  sc('t6', 'team', 'Your team cannot agree who should present to an important client, and the discussion is going round in circles.', [
    ['Suggest choosing based on strengths and the client’s needs, agree roles, check with your manager and support the choice.', 'communication', 'A clear method helps the team decide fairly and move on.'],
    ['Volunteer yourself without discussing it.', 'ownership', 'It ends the deadlock, but without consultation it may not be the best choice.'],
    ['Let the most forceful person decide.', 'communication', 'The loudest voice is not necessarily the best judge, and others may feel overruled.'],
    ['Refuse to present and leave it to others.', 'ownership', 'Stepping away from the problem does not help the team or the client.'],
  ]),

  // ------------------------------------------------------------------ Unclear instructions
  sc('u1', 'clarity', 'Your manager asks you to “sort out the data” with no further detail, then goes into meetings for the whole day.', [
    ['Write down what you think is needed, send it for a quick yes or no and start on the clearly defined parts.', 'communication', 'You make progress while giving your manager a quick way to confirm or correct.'],
    ['Wait until they are free before doing anything.', 'ownership', 'It avoids mistakes but wastes the day when you could have drafted and checked.'],
    ['Do what you think is best without checking.', 'ownership', 'You risk working on the wrong thing and having to redo it.'],
    ['Ask a teammate to do it so you do not get it wrong.', 'escalation', 'Passing the task on avoids the problem and does not clarify the request.'],
  ]),
  sc('u2', 'clarity', 'Two senior colleagues give you conflicting instructions about how to format a client deliverable.', [
    ['Tell both of the conflict and ask them to agree, or ask your manager to decide.', 'escalation', 'Conflicts between seniors should be resolved by them or your manager, not by you guessing.'],
    ['Follow the more senior person’s instructions.', 'ownership', 'It is a quick rule, but seniority does not make an instruction right for the client.'],
    ['Follow whichever you prefer.', 'ownership', 'Personal preference is not a good basis for a client deliverable.'],
    ['Do half of each and hope it works.', 'client', 'A compromise nobody asked for is likely to satisfy no one.'],
  ]),
  sc('u3', 'clarity', 'You are asked to prepare a client summary but nobody has said which format the client prefers.', [
    ['Look at previous work for that client, check with the account manager or client contact and note your assumptions.', 'client', 'You use evidence, ask the right people and make your assumptions visible.'],
    ['Choose the format you like and send it.', 'client', 'You deliver on time, but the client may need to ask for it to be redone.'],
    ['Wait for someone to tell you.', 'ownership', 'Waiting delays the work when a quick question would have solved it.'],
    ['Skip the summary because the instructions were incomplete.', 'ownership', 'Not delivering because the brief was incomplete lets the client down.'],
  ]),
  sc('u4', 'clarity', 'You are asked to give a presentation next week with no information about the audience, length or purpose.', [
    ['Ask the requester about the audience, purpose, length and outcome, then draft an outline for them to confirm.', 'communication', 'A few targeted questions and a draft outline get alignment early at low cost.'],
    ['Prepare a general presentation covering as much as possible.', 'ownership', 'It is diligent, but without direction you will probably spend time on the wrong things.'],
    ['Wait until the day before and ask then.', 'communication', 'Late questions leave no time to adjust.'],
    ['Say you cannot do it without a full brief.', 'ownership', 'Refusing outright is unhelpful when you could have asked for what you need.'],
  ]),
  sc('u5', 'clarity', 'An email asks you to “update the model”. It could mean refreshing the data or changing the assumptions, and the sender is on leave until Thursday.', [
    ['Reply with both interpretations, say which you will start with, and ask for confirmation.', 'communication', 'You make progress and show the sender exactly where to correct you.'],
    ['Choose one meaning and complete it without telling anyone.', 'ownership', 'You might get it right, but you could waste time or change something that should not change.'],
    ['Do both fully to be safe.', 'ownership', 'It is thorough but could double the effort and change things that were not requested.'],
    ['Wait until the sender returns on Thursday.', 'ownership', 'Doing nothing for days is avoidable when you could ask another contact or draft options.'],
  ]),
  sc('u6', 'clarity', 'A senior colleague tells you to combine two sets of figures in a way you believe would double count some revenue.', [
    ['Check your reasoning, then raise it respectfully with a clear example and suggest an alternative.', 'integrity', 'Testing your view and presenting it constructively protects accuracy and the working relationship.'],
    ['Follow the instruction without comment because they are more senior.', 'ownership', 'Staying silent when you believe there is an error risks inaccurate results.'],
    ['Quietly do it your own way without telling them.', 'communication', 'You may be right, but acting behind their back undermines trust.'],
    ['Complain to your colleagues about the instruction.', 'communication', 'Complaining to others does not fix the figures or help the person who gave the instruction.'],
  ]),
];
