# CODE SRIJAN COMMUNICATIONS ARCHITECTURE

Think of the CodeSrijan chat system as one communication platform with different conversation types, rather than separate chat pages.

The cleanest architecture is this:

```text
                         CODE SRIJAN COMMS
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
         DIRECT CHAT        TEAM CHAT          SUPPORT
             │                  │                  │
        User ↔ User       Team Members      User ↔ Admin
             │                  │                  │
             │             Mentor access           │
             │                  │                   │
             └───────────────┬──┴───────────────────┘
                             │
                       ONE CHAT SYSTEM
                             │
                    Conversations + Messages
                             │
                         Notifications
```

## 1. What the user sees

For a normal student, the main entry is:

`/chat`

The UI should look roughly like:

```text
┌──────────────────────────────────────────────────────────┐
│ COMMUNICATIONS                                           │
├──────────────────┬───────────────────────────────────────┤
│ Search people... │                                       │
│                  │   Priya Nair                          │
│ CONVERSATIONS    │   ● Online                            │
│                  │                                       │
│ Priya Nair       │   Aarav: Can you update the flow?     │
│ Neha Kapoor      │   Priya: Yes, I'll do it.             │
│ CodeSrijan Admin │                                       │
│ Team Alpha       │                                       │
│                  │                                       │
│                  │   [ Type a message... ] [ Send ]      │
└──────────────────┴───────────────────────────────────────┘
```

The left side is the conversation list.
The center/right side is the selected conversation.
The top search is for starting a new conversation.

## 2. There should be four conversation types

I would define four main types.

### A. Direct Message
User A ↔ User B
Example: Aarav ↔ Priya
Use case: "Are you interested in joining my team?"
The chat is private to those two users.

### B. Team Chat
Team Alpha
├── Aarav
├── Priya
├── Arjun
└── Meera

This is the team's internal conversation.
A student should automatically see their own team chat after joining the team.

### C. Mentor Chat
A mentor should not automatically see every team's chat.
The flow is:
Student → Team Workspace → REQUEST HELP / SOS → Admin Mentor Queue → Assign Neha → Neha gains authorized team access → Neha joins Team Alpha private communication

## 3. Support chat
You should think of Support Ticket + Support Chat as one workflow, not two unrelated features.

Student → HELP → Create Support Ticket → Ticket #CS-1001 → Support Queue → Admin opens ticket → OPEN COMMS → Private Support Conversation

The ticket stores the issue and status.
The chat stores the conversation around the issue.

## 4. How support should look to a student
The student clicks `HELP`. They should see:

```text
┌──────────────────────────┐
│       NEED HELP?         │
├──────────────────────────┤
│ 💬 Talk to Admin         │
│ Quick communication      │
│                          │
│ 🎫 Support Ticket        │
│ Track a formal issue     │
│                          │
│ 🐛 Report a Bug          │
│ Report platform problem  │
│                          │
│ ❓ FAQ                   │
└──────────────────────────┘
```

## 5. What happens after the student creates a ticket
The system creates:
`Support Ticket CS-1001` and a related conversation `Support Conversation CS-1001`.

## 6. What the admin sees
Admin goes to: `/admin/support`
The admin clicks the ticket and sees:
```text
TICKET #CS-1001
[ Reply ] [ Assign Admin ] [ Open Comms ] [ Change Status ]
```

## 7. Open Comms
Admin clicks `Open Comms`. Now `/admin/chat?conv=...`.
The ticket already knows: `ticket → requester → support conversation`. So Open Comms should open the correct conversation automatically.

## 8. Ticket status and chat status are different
Don't make: Chat = ticket status
Instead: Conversation + Support Ticket.
Admin can continue chatting while the ticket remains open. When the issue is fixed, `Ticket: RESOLVED`, the conversation can still remain available for history.

## 9. Support lifecycle
OPEN → IN_PROGRESS → WAITING → IN_PROGRESS → RESOLVED → CLOSED
And reopening: RESOLVED → REOPEN → OPEN

## 10. What the student sees
`/support` with `MY TICKETS`. Opening the ticket shows the Chat / Ticket History. To them, it feels like: "I reported a problem and I'm talking to support."

## 11. Admin's complete communication center
`/chat` usable by admins too, but the admin gets more capabilities.
The admin can search users and open conversations, but support conversations should remain clearly identified as support cases.

## 12. User search
Search should return users, not existing conversations only.
If a DM already exists: Open existing conversation. If none exists: Create conversation. That avoids duplicate DM records.

## 13. Search should not show everyone everything
Search results can show: Name, Username, Avatar, Role, Team, Online status. Do not expose sensitive info.

## 14. Mentor communication
Admin chooses Neha. Then Neha + Team Alpha gets connected. Assigning a mentor should provide access to the team's workspace and private team chat.

## 15. Mentor view
Mentor opens `/mentor` and sees `MY TEAMS`. Click Team Alpha: `WORKSPACE`, `CHAT`, `PROGRESS`, `NOTES`.

## 16. Team chat
Student → Student, Mentor → Team, Team → Mentor, all inside the authorized team channel.

## 17. Admin-to-user direct chat
An admin should also be able to start a normal DM when appropriate.

## 18. Notifications
Every important communication event should create a notification (Unread/read system).

## 19. Unread/read system
Notification count updates when opening conversation. State persists after refresh.

## 20. Online status
Online/Offline. Don't make online presence a hard dependency for messaging.

## 21. Message states
Sending, Sent, Delivered, Read, Failed.

## 22. Attachments
Image, PDF, ZIP, Link. Keep upload security strict.

## 23. Message database concept
```text
Conversation
──────────────────
id, type, members, teamId, supportTicketId, createdAt, updatedAt, lastMessage

Message
──────────────────
id, conversationId, senderId, body, createdAt, readAt, messageType, attachments
```

## 24. Support-ticket database relationship
```text
SupportTicket
      │
      ├── requesterId
      ├── assignedAdminId
      ├── status
      ├── priority
      ├── category
      └── conversationId
                         │
                         ↓
                  Conversation
```

## 25. What happens when an admin closes a ticket?
Backend updates `SupportTicket.status = RESOLVED`. User receives notification. Conversation remains readable.

## 26. Admin support queue
Filters: ALL, OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED, HIGH, NORMAL, LOW, TECHNICAL, ACCOUNT, TEAM, etc.

## 27. Conversation permissions
- **Direct chat**: Only A and B.
- **Team chat**: Team Alpha members + authorized mentors.
- **Support**: Requester + assigned support/admin staff.
- **Admin**: Admins can access support conversations.
- **Judge**: Judges should not automatically receive access.
- **Mentor**: Mentor only sees assigned/authorized teams.

## 28. User perspective
CHAT ├── People ├── Teams ├── Mentors └── Support

## 29. Admin perspective
COMMUNICATIONS ├── DIRECT ├── TEAMS ├── MENTORS └── SUPPORT

## 30. Recommended user flow
USER → CHAT → Search → Person → Start DM

## 31. Recommended admin flow
ADMIN → CHAT / SUPPORT → See ticket → Open Comms → Reply → Assign → Update Status → Resolve → Audit Log

## 32. What should happen in real time
A sends message → Server → Database → Socket event → B receives instantly → Notification. Database persistence must happen regardless of whether the socket connection works.

## 33. What happens if the network disconnects?
Sending... → Failed to send [ Retry ]. It must not display Sent unless the server actually accepted the message.

## 34. Duplicate-message protection
Use a client-generated message/request ID for mutation idempotency.

## 35. Platform Integration
TEAM CREATED → TEAM CHAT CREATED
MENTOR ASSIGNED → MENTOR ACCESS + CHAT
SUPPORT TICKET CREATED → SUPPORT CONVERSATION
JUDGE ASSIGNED → JUDGE NOTIFICATION
ANNOUNCEMENT PUBLISHED → NOTIFICATION
SUBMISSION RECEIVED → ADMIN/JUDGE NOTIFICATION
EVALUATION COMPLETED → ADMIN NOTIFICATION

The chat/notification layer should be the communication infrastructure underneath the entire platform.

## 36. The final CodeSrijan communication architecture

```text
                    COMMUNICATIONS
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
      PEOPLE             TEAMS             SUPPORT
        │                  │                  │
    Direct DM         Team Chat          Tickets
        │                  │                  │
        │              Mentors                │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     MESSAGE ENGINE
                           │
                 ┌─────────┼─────────┐
                 │         │         │
              Messages  Read State Notifications
                 │         │         │
                 └─────────┼─────────┘
                           │
                      Audit Logs
```

### In one sentence
Chat handles communication; Support Tickets handle issues; the two are linked whenever an issue requires a conversation with an admin.
