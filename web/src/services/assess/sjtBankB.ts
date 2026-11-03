import { sc, type SjtScenario } from './sjtBank';

/**
 * Scenarios set in technology teams, written around the behaviours large software employers describe:
 * learning from mistakes, inclusive teamwork, putting the customer first, working across teams,
 * taking initiative and handling data and AI responsibly. All wording is original.
 */
export const SJT_SCENARIOS_B: SjtScenario[] = [
  // ------------------------------------------------------------------ Learning from feedback
  sc('tw-g1', 'growth', 'In a code review a senior engineer says your approach to a feature is hard to maintain and suggests a different design. You spent two days on it and you are not sure they are right.', [
    ['Ask them to walk through their reasoning, try the alternative on a small part, and compare the results before deciding.', 'learning', 'Treating the feedback as a chance to learn while testing it with evidence respects both their experience and your own judgement.'],
    ['Thank them, rewrite it their way at once and say nothing about your doubts.', 'learning', 'You take feedback on board, but you learn less and may hide a real concern when you do not discuss it.'],
    ['Explain why your design is better and ask for the review to be approved as it is.', 'communication', 'Defending your work is fair, but closing the discussion without exploring their point wastes a chance to improve.'],
    ['Quietly merge your version while the reviewer is away.', 'integrity', 'Going around a review undermines the team’s process and trust.'],
  ]),
  sc('tw-g2', 'growth', 'A release you led shipped with a bug that locked some users out for an hour. A fix is live. Your manager asks for a short write-up.', [
    ['Describe what happened, why it got through, what you will change in the checks and what you learned, without blaming anyone.', 'learning', 'A blameless, honest write-up turns a mistake into improvements that the whole team can use.'],
    ['Write a brief note that says the bug is fixed and leaves out how it slipped through.', 'integrity', 'It is accurate but gives the team nothing to learn from, so the same gap can open again.'],
    ['Explain that the bug came from a library update and was not really your fault.', 'ownership', 'The cause may be true, but focusing on blame instead of the gap in your checks avoids ownership.'],
    ['Ask someone else to write it so your name stays off it.', 'integrity', 'Avoiding the write-up hides responsibility and misses the learning that belongs to you.'],
  ]),
  sc('tw-g3', 'growth', 'You are asked to join a project that uses a framework you have never used, and the first milestone is in three weeks.', [
    ['Say yes, tell the lead where your gaps are, set aside learning time, and ask a teammate to pair with you early on.', 'learning', 'Accepting a stretch task while being open about gaps and getting support is how people grow without putting the milestone at risk.'],
    ['Say yes and teach yourself in the evenings without mentioning it to anyone.', 'ownership', 'It shows effort, but not asking for help or flagging the risk makes delays more likely.'],
    ['Decline because you are not an expert and the deadline is tight.', 'communication', 'Being cautious is understandable, but turning down every unfamiliar task limits learning and team flexibility.'],
    ['Accept, then hand the unfamiliar parts to a colleague without explaining why.', 'ownership', 'Passing off the hard parts means you do not learn and the team has an unplanned burden.'],
  ]),
  sc('tw-g4', 'growth', 'Your annual feedback says you tend to jump into solutions before understanding the problem. You feel the comment is a bit unfair.', [
    ['Ask for two recent examples, reflect on them honestly and agree one habit to try over the next month.', 'learning', 'Seeking specifics and acting on them turns vague feedback into a concrete change.'],
    ['Accept the comment, say you will do better and carry on as before.', 'learning', 'It is polite, but without a concrete change the feedback is unlikely to lead to improvement.'],
    ['Explain that being quick is a strength and that your results show it.', 'communication', 'There may be truth in that, but dismissing the feedback closes off a chance to see what you may be missing.'],
    ['Tell colleagues the feedback was unfair and not worth taking seriously.', 'integrity', 'Undermining feedback with others harms trust and does nothing to address the concern.'],
  ]),
  sc('tw-g5', 'growth', 'An experiment you ran for two weeks shows that the new feature you proposed does not improve engagement.', [
    ['Share the results openly, explain what you think they show and suggest what to try next.', 'learning', 'A negative result is still a finding, and sharing it quickly saves the team time.'],
    ['Run it again with a different measure that might look better.', 'integrity', 'Searching for a result you prefer undermines the value of the test.'],
    ['Wait for the next planning meeting before mentioning it.', 'communication', 'The result is honest, but delaying it lets the team keep investing in something that does not work.'],
    ['Drop the feature without telling anyone and move on to the next idea.', 'communication', 'Quietly dropping it wastes the lesson and leaves others unsure what happened.'],
  ]),

  // ------------------------------------------------------------------ Inclusive teamwork
  sc('tw-i1', 'inclusion', 'In design meetings one colleague, who is new and quiet, never speaks, and the discussion is dominated by two senior people.', [
    ['Invite them to share their view in the meeting and, afterwards, ask privately how the meetings could work better for them.', 'inclusion', 'Making room in the moment and following up respects their preferences and widens the ideas heard.'],
    ['Suggest to the meeting lead that everyone adds ideas in writing before the discussion.', 'inclusion', 'A structural change helps everyone take part, though it may not address this colleague’s needs directly.'],
    ['Say nothing; they will speak up when they are ready.', 'inclusion', 'Waiting leaves the pattern unchanged and the team misses their contribution.'],
    ['Tell the colleague they need to be more assertive if they want to be heard.', 'communication', 'Putting the burden on them ignores how the meeting works and can discourage them further.'],
  ]),
  sc('tw-i2', 'inclusion', 'A teammate jokes about a colleague’s accent in the team chat. Others react with laughing emojis, and the colleague has not replied.', [
    ['Speak to your teammate privately, explain why it is hurtful, and check in with the colleague.', 'inclusion', 'Addressing the behaviour directly and supporting the person affected is respectful and likely to work.'],
    ['Reply in the chat that the joke is not okay.', 'inclusion', 'It shows a clear standard, but a public reply may embarrass people and does not check on the colleague.'],
    ['Report it to your manager without speaking to either person.', 'escalation', 'Raising it is right if it continues, but going straight to a manager skips an easy chance to resolve it.'],
    ['Ignore it because it was a joke and nobody complained.', 'inclusion', 'Silence tells the team the behaviour is acceptable and leaves the colleague unsupported.'],
  ]),
  sc('tw-i3', 'inclusion', 'You are planning a team social. Two colleagues do not drink alcohol and one has caring duties after 5 pm.', [
    ['Ask the team what would work, then choose a time and an activity that everyone can join.', 'inclusion', 'Asking and designing around real needs makes sure no one is left out.'],
    ['Pick a lunchtime activity because it is easier for most people.', 'inclusion', 'It is a sensible default, but without asking you may still miss someone’s needs.'],
    ['Hold the usual evening drinks and send a recording of the speeches to those who cannot come.', 'inclusion', 'It keeps the tradition, but those who cannot attend miss the main event.'],
    ['Cancel the social because it is hard to suit everyone.', 'inclusion', 'Removing the event avoids the problem and takes away a chance to build the team.'],
  ]),
  sc('tw-i4', 'inclusion', 'While reviewing a feature, you notice its screens are hard to use with a screen reader. The release is in two days and nobody has raised it.', [
    ['Raise it now with specifics, propose the smallest fixes that can ship and log the rest with a date.', 'inclusion', 'Speaking up early with practical options keeps the date and treats accessibility as part of quality.'],
    ['Note it in the backlog for a later release and say nothing before launch.', 'inclusion', 'Tracking it helps, but users who rely on a screen reader meet the problem on day one.'],
    ['Assume the product team has already considered it.', 'responsibility', 'Assuming someone else has checked is how known problems ship.'],
    ['Delay the release by yourself until it is fixed.', 'ownership', 'The concern is right, but acting alone on a release date bypasses the people who decide it.'],
  ]),
  sc('tw-i5', 'inclusion', 'A colleague interrupts a teammate repeatedly and later presents the teammate’s idea as their own at a team meeting.', [
    ['Mention in the meeting that the idea came from your teammate, then talk to the colleague about it afterwards.', 'inclusion', 'Giving credit straight away and following up privately fixes the harm and addresses the behaviour.'],
    ['Check with your teammate how they feel and offer to support them if they raise it.', 'inclusion', 'It supports your teammate but leaves the credit and the behaviour unaddressed for now.'],
    ['Tell other colleagues that the first colleague tends to take credit.', 'communication', 'Spreading it around damages trust and does nothing to resolve the problem.'],
    ['Stay out of it because it is between them.', 'inclusion', 'Staying silent leaves your teammate to deal with it alone.'],
  ]),

  // ------------------------------------------------------------------ Customer first
  sc('tw-c1', 'customer', 'A customer on a support call says a data export feature has been failing for them for a week. The product team says it is a low priority.', [
    ['Reproduce the problem, gather evidence of how many customers are affected and take it back to the product team with a clear case.', 'client', 'Evidence of the real impact lets the team re-prioritise on facts, which is how the customer gets help.'],
    ['Tell the customer it is a known issue and give no date.', 'client', 'It is honest but leaves the customer without help or an update.'],
    ['Promise the customer a fix by Friday to calm them.', 'integrity', 'A promise you do not control damages trust when it is missed.'],
    ['Suggest the customer find another tool.', 'client', 'It shows no ownership of the problem and loses the customer.'],
  ]),
  sc('tw-c2', 'customer', 'You discover that a recent change doubled loading time for one group of customers. Nobody has complained yet and your manager is on leave.', [
    ['Tell the on-call lead now, share what you know and help to decide whether to roll back or fix.', 'escalation', 'Customers are being affected today and the on-call lead owns the decision, so quick, factual escalation is right.'],
    ['Investigate quietly for a few days until you are sure of the cause.', 'ownership', 'Being thorough is good, but waiting means customers suffer for longer.'],
    ['Wait for customers to complain so you know it is a real problem.', 'client', 'Relying on complaints leaves customers frustrated before anyone acts.'],
    ['Roll back the change yourself without telling anyone.', 'integrity', 'Acting alone on production without telling the team can cause new problems and confusion.'],
  ]),
  sc('tw-c3', 'customer', 'A customer asks for a feature that the roadmap does not include, and building it would take several weeks.', [
    ['Ask about the problem they are trying to solve, suggest an existing workaround and pass the request to product with the context.', 'client', 'Understanding the need helps you give immediate help and gives the team useful input.'],
    ['Say yes to keep them happy and work out the effort later.', 'integrity', 'An unrealistic yes leads to disappointment and strains the team.'],
    ['Say it is not planned and move on.', 'client', 'It is honest but misses the need behind the request.'],
    ['Build a quick version in your own time without telling anyone.', 'ownership', 'It is well meant, but unplanned work creates a maintenance and support burden for the team.'],
  ]),
  sc('tw-c4', 'customer', 'A frustrated customer is angry about a billing error that your team caused. They are demanding to speak to someone senior straight away.', [
    ['Apologise for the error, confirm the facts, say exactly what you will do and by when, and offer to bring in a senior colleague if they still want it.', 'client', 'A sincere apology and a concrete plan usually calms the situation while keeping the customer informed.'],
    ['Pass them to a senior colleague immediately without further explanation.', 'escalation', 'Escalation may be needed, but handing over without attempting to help makes the customer repeat their story.'],
    ['Explain the billing process in detail so they understand how it happened.', 'communication', 'The explanation may help later, but it sounds defensive while they are upset.'],
    ['Tell them the error was caused by another team.', 'ownership', 'Blaming another team does not help the customer and weakens trust in all of you.'],
  ]),
  sc('tw-c5', 'customer', 'Usage data shows that customers often abandon a signup step. A colleague suggests adding a pop-up that makes it hard to close, to collect more email addresses.', [
    ['Suggest talking to a few customers and testing a simpler step, since the data shows people are struggling.', 'client', 'Understanding why people leave and testing an improvement serves customers and the business.'],
    ['Agree with the pop-up because it will increase the number of emails.', 'client', 'It may add emails in the short term but frustrates the people you want to keep.'],
    ['Ask for approval to run the pop-up just for a week and see the effect on the numbers.', 'client', 'Testing is better than guessing, but it treats a hard-to-close pop-up as acceptable.'],
    ['Say nothing because it is not your area.', 'impact', 'You have relevant data and staying silent wastes the chance to improve the product.'],
  ]),

  // ------------------------------------------------------------------ Working across teams
  sc('tw-t1', 'collab', 'Your team depends on a service owned by another team. They are very busy and have not replied to your request for a change that you need next sprint.', [
    ['Contact them directly, explain what you need and why, offer to help with the work and agree a date.', 'communication', 'Making the request clear, offering help and agreeing a date respects their workload and gets you an answer.'],
    ['Raise it with your manager so they can ask the other team’s manager.', 'escalation', 'Escalation is sometimes needed, but going to managers before a direct conversation skips a simple step.'],
    ['Build a workaround in your own code and tell nobody.', 'ownership', 'It keeps you moving but adds hidden complexity and the other team never learns what you need.'],
    ['Wait for them to reply while your own work slips.', 'ownership', 'Waiting passively puts your sprint at risk and gives them no reason to act.'],
  ]),
  sc('tw-t2', 'collab', 'Two teams, including yours, are building very similar tools without knowing about each other. You find out by accident.', [
    ['Contact the other team, compare plans and suggest a call to see whether you can share work, and tell your manager.', 'communication', 'Sharing early avoids duplicated effort and keeps leads informed of a change in plans.'],
    ['Tell your manager and let them handle it.', 'escalation', 'Raising it is right, but you miss the chance to start the conversation yourself.'],
    ['Finish your own tool faster so yours becomes the standard.', 'integrity', 'Competing instead of cooperating wastes company effort and damages trust.'],
    ['Keep quiet because each team has its own goals.', 'communication', 'Staying silent allows avoidable duplication to carry on.'],
  ]),
  sc('tw-t3', 'collab', 'A designer and an engineer on your project disagree about how a screen should work, and the argument is slowing the sprint.', [
    ['Suggest a short meeting where each explains their goals, ask what users need, and agree on a small test to settle it.', 'communication', 'Moving from positions to goals and evidence resolves the disagreement in a way both can accept.'],
    ['Ask the product manager to decide.', 'escalation', 'A decision may be needed, but asking for it before trying to resolve it together can leave both feeling unheard.'],
    ['Side with the engineer because you work with them more.', 'integrity', 'Choosing sides by familiarity instead of the problem weakens the team.'],
    ['Wait for them to sort it out.', 'ownership', 'The delay affects everyone, and you are able to help.'],
  ]),
  sc('tw-t4', 'collab', 'You are on a call with colleagues in three time zones. It is late for some, and decisions keep being made after others have left.', [
    ['Propose rotating the meeting time, recording decisions in writing and checking with those who could not attend.', 'inclusion', 'Sharing the burden and writing down decisions keeps people included wherever they are.'],
    ['Send notes after each call to those who missed it.', 'communication', 'It helps people catch up but they still miss out on the discussion.'],
    ['Keep the current time because it works for most people.', 'inclusion', 'It is convenient for the majority but leaves the same people out every time.'],
    ['Skip the calls and read the notes yourself.', 'ownership', 'It solves your problem but not the team’s.'],
  ]),
  sc('tw-t5', 'collab', 'A new teammate asks you for help understanding the codebase just as you are trying to finish your own task.', [
    ['Give them a quick overview now, point them to the key docs and book a proper time to pair later in the week.', 'communication', 'Helping straight away and setting up time later supports them without dropping your own work.'],
    ['Drop your task and spend the afternoon helping them.', 'ownership', 'Generous, but it puts your own deadline at risk without telling anyone.'],
    ['Tell them to read the docs and ask again if they get stuck.', 'communication', 'It is fair to point to documents, but a new teammate may feel unwelcome without any help.'],
    ['Ask them to wait until you have finished, without saying when.', 'communication', 'An open-ended wait leaves them stuck and unsure when help will come.'],
  ]),

  // ------------------------------------------------------------------ Taking initiative
  sc('tw-m1', 'impact', 'You notice that the team spends about an hour each week on a manual report that could be automated in a day.', [
    ['Estimate the time saved, share the idea with your manager and offer to build it alongside your regular work.', 'impact', 'A clear case and an offer to do the work shows initiative while respecting priorities.'],
    ['Build the automation in your spare time and announce it when finished.', 'impact', 'It shows initiative, but without agreement you may duplicate work or build the wrong thing.'],
    ['Mention it in passing in a team chat and leave it there.', 'communication', 'The idea is shared but nobody owns the next step so nothing happens.'],
    ['Keep doing the manual report because it is not your responsibility to change it.', 'impact', 'Seeing an improvement and doing nothing wastes a chance to make a difference.'],
  ]),
  sc('tw-m2', 'impact', 'During an outage at night, you are the first to notice but you are not on call. The on-call engineer has not responded to the alert.', [
    ['Try to reach the on-call engineer and their backup through the official process, and share what you see so that anyone can act.', 'escalation', 'Following the escalation process while sharing what you know gets the right person involved quickly.'],
    ['Fix it yourself immediately, using your admin access.', 'ownership', 'Initiative is good, but unplanned changes made outside the process can make an outage worse.'],
    ['Assume the alert has been seen and go back to what you were doing.', 'ownership', 'Assuming others have seen it is how outages last longer than they should.'],
    ['Post about it in a large chat channel and leave it there.', 'communication', 'Awareness helps but without contacting the right person there may be no action.'],
  ]),
  sc('tw-m3', 'impact', 'Your team has a long list of requests and not enough time. You think one proposed project will help only a few customers.', [
    ['Gather data on who benefits, compare it with the other options and share your analysis with the team before the planning meeting.', 'impact', 'Using evidence to point the team at the biggest impact is a constructive way to challenge a plan.'],
    ['Say in the meeting that the project is a waste of time.', 'communication', 'Disagreement is fine, but without evidence it sounds negative and is easy to dismiss.'],
    ['Do the project but give it less effort than the others.', 'integrity', 'Quietly lowering effort hides your concern and gives a poor result.'],
    ['Work on whichever task you personally prefer.', 'ownership', 'Choosing by preference ignores the team’s priorities.'],
  ]),
  sc('tw-m4', 'impact', 'You finish your assigned work two days early. The sprint board has several unassigned tasks and your team is under pressure.', [
    ['Tell the team you have capacity, pick the task that is most valuable, and check that nobody else has started it.', 'impact', 'Offering capacity and checking before starting avoids duplicated work and helps the team most.'],
    ['Pick the easiest unassigned task and finish it.', 'impact', 'You help, but choosing by ease may leave the most valuable work untouched.'],
    ['Use the time to learn something for yourself without telling anyone.', 'impact', 'Learning is useful, but a team under pressure could use the capacity you have.'],
    ['Wait until the next planning session to be assigned more work.', 'ownership', 'Waiting leaves capacity unused when the team needs it.'],
  ]),
  sc('tw-m5', 'impact', 'You have an idea that could cut your team’s build time in half, but it would mean changing a tool that other teams also use.', [
    ['Build a small prototype, measure the improvement and discuss it with the other teams before proposing a change.', 'impact', 'A proof of value plus early talks with those affected makes a big change safe and credible.'],
    ['Propose the change to your own team only and make it if they agree.', 'communication', 'Your team’s support is useful but the other teams who use the tool are not consulted.'],
    ['Make the change quietly because the result will be better for everyone.', 'integrity', 'Changing a shared tool without telling users risks breaking their work and trust.'],
    ['Drop the idea because it is too much trouble.', 'impact', 'A potentially large benefit is lost without even trying.'],
  ]),

  // ------------------------------------------------------------------ Responsible data and AI
  sc('tw-a1', 'data', 'You are using an AI assistant to draft code for a customer feature. It produces a solution that looks right but you do not fully understand one part.', [
    ['Work out what that part does, test it properly and rewrite or document it, and only then include it.', 'responsibility', 'AI output is a draft: you remain responsible for understanding and testing what you ship.'],
    ['Include it because it passes the basic tests.', 'responsibility', 'Passing a few tests does not show that code you do not understand is safe.'],
    ['Ask a colleague to approve it in review without telling them it was AI-generated.', 'integrity', 'Hiding where code came from stops reviewers from judging it properly.'],
    ['Avoid the AI assistant from now on.', 'learning', 'Avoiding useful tools is an overreaction when careful checking solves the problem.'],
  ]),
  sc('tw-a2', 'data', 'To debug an issue faster you want to paste a customer’s support ticket, which includes their name and email address, into a public AI chat tool.', [
    ['Remove or replace the personal details first, or use an approved internal tool, then ask for help.', 'responsibility', 'Protecting personal data while still solving the problem respects customers and company policy.'],
    ['Paste it as it is because the tool is quick and the data is small.', 'responsibility', 'Customer data should not be shared with external tools without approval.'],
    ['Paste only the email address, since the name is less important.', 'responsibility', 'An email address is also personal data, so this still breaks the rule.'],
    ['Ask a colleague to paste it so it does not come from your account.', 'integrity', 'Passing the action to someone else hides the breach and spreads the risk.'],
  ]),
  sc('tw-a3', 'data', 'A new model your team built predicts which job applicants to shortlist. You notice it shortlists fewer people from some postcodes, and the launch is next week.', [
    ['Share the finding with your lead now, show the evidence and recommend testing for bias before launch.', 'responsibility', 'Flagging a fairness risk early, with data, gives the team time to check and fix it.'],
    ['Launch as planned and monitor the results afterwards.', 'responsibility', 'Monitoring after launch means affected people may already have been treated unfairly.'],
    ['Quietly remove postcode from the model without telling anyone.', 'integrity', 'The change may help but made in secret it may not solve the bias and nobody learns from it.'],
    ['Assume the model is neutral because it is based on data.', 'responsibility', 'Data can reflect past bias, so a model built on it needs to be checked.'],
  ]),
  sc('tw-a4', 'data', 'You find a spreadsheet containing real customer records on a shared drive that everyone in the company can open.', [
    ['Report it to the security team straight away, avoid copying it and tell the owner if you know who it is.', 'responsibility', 'Exposed personal data is a security incident, and reporting quickly limits the harm.'],
    ['Message the owner and wait for them to fix it.', 'escalation', 'Telling the owner is good, but the security team needs to know in case the data has been accessed.'],
    ['Change the permissions yourself and say nothing.', 'ownership', 'Fixing the access is helpful, but without a report the company cannot assess what happened.'],
    ['Ignore it because someone else will have noticed.', 'responsibility', 'If everyone assumes this, nobody reports it.'],
  ]),
  sc('tw-a5', 'data', 'Your manager asks you to add tracking to an app that records how customers use it. You suspect it collects more than the privacy notice says.', [
    ['Ask what data is being collected and why, compare it with the privacy notice, and raise the gap with the privacy lead before building.', 'responsibility', 'Checking the purpose against what customers were told keeps the product honest and lawful.'],
    ['Build it as asked and mention your concern afterwards.', 'responsibility', 'Raising it after the work is done leaves the product collecting data customers did not agree to.'],
    ['Collect only what you think is reasonable and say nothing.', 'integrity', 'Deciding by yourself, silently, means the real design is not reviewed by anyone.'],
    ['Refuse to do the task and say nothing more.', 'communication', 'The concern is valid but refusing without explaining prevents it from being fixed.'],
  ]),
];
