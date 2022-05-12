# RTM Outline:: Draft

- Relations (entities specific to an adapter): Abstract data store semantics
- Aggregates (collect relations, across adapters): Abstract across Data stores
- Commands (create, update, delete): General to Relations and Aggregates
- Domain (Repositories in ROM, Aggregates in cqrs-es).
- Events transparent in RTM, user responsibility in Sequent and cqrs-es.
- Ephemera

## Performance and ergonomics ideas

- [Sub and super traits](https://users.rust-lang.org/t/solved-calling-a-default-subtrait-method-from-the-supertrait-default-method/39648/9?u=taqtiqa-mark)
- [Vector/collection of trait objects](https://users.rust-lang.org/t/how-to-make-a-struct-that-holds-a-vector-collection-of-trait-objects/12829/7)
  - [Playground Poc - Vector](https://play.rust-lang.org/?gist=b5a3be0dc0127e22360726542a66b193&version=stable)
  - [Playground PoC - HashMap](https://play.rust-lang.org/?gist=30ccb6b37e76afa72faf72be858c4121&version=stable)
  - [HashMap with type erased keys](https://stackoverflow.com/questions/64838355/how-do-i-create-a-hashmap-with-type-erased-keys)
  - [Clone solution](https://users.rust-lang.org/t/how-to-make-a-struct-that-holds-a-vector-collection-of-trait-objects/12829/10?u=taqtiqa-mark)
- [Atomic Arcs and caching](https://vorner.github.io/2020/09/03/performance-cheating.html)
  - [arc-swap](https://crates.io/crates/arc-swap)
  - Use: RTM Configuration structures modelled on Sea-ORM.
- [Dropping large data structures](https://abramov.io/rust-dropping-things-in-another-thread)
  - Use: The large count of rows.
- [Bumpalo](https://github.com/fitzgen/bumpalo)
  - [Hide Bumpalo's lifetime parameter](https://blog.reverberate.org/2021/12/19/arenas-and-rust.html)
  - [Areanas in Rust](https://manishearth.github.io/blog/2021/03/15/arenas-in-rust/)
  - Use: Append-only memory pool. It only bumps a pointer to pre-allocated
    memory. It doesn't support freeing or recycling of memory, other than via
    destruction of the entire pool.

## Aggregates & Events

Different implementations take different approaches:

[cqrs-es](https://docs.rs/cqrs-es/latest/cqrs_es/) Crate, referring to aggregates, [says](https://doc.rust-cqrs.org/theory_updates.html):

> This involves requesting the changes via a command and reflecting the
> actual changes in one or more events.

[further](https://doc.rust-cqrs.org/intro_add_aggregate.html):

>Once events have been committed they will need to be applied to the
> aggregate in order for it to update its state.

[Sequent](https://www.sequent.io/docs/concepts/aggregate-root.html) gem:

> Therefor the state of an AggregateRoot is the result of applying all
> Events for that AggregateRoot

## Components

## Events

These are transparent to the user.  Other implmentations make event creation,
and event management a user responsibility.

To eliminate this chore we make embrace several constraints:

1. Commands: Create, Update, Delete
2. Command type names map to command function names: `MyCommand` -> `my_command`
3. Only one command is arbitrated by the Domain logic at any point in time.
4. Only one Event is emitted per Command, and the event records the full
   state of the Aggregate after the command completed.
5. The user has `*_event_before()` and `*_event_events()` functions available.
   These are invoked before/after the Command Event

These constraints permit us to make each Event and Event management transparent
to the user.  Event creation and management is not a user responsibility.

### Example (stylized)

```rust
#[derive(Aggregate)]
#[rtm(relation=Account)] // Add Account fields to struct
struct BankAccount;

#[derive(rtm::Create, rtm::Delete, rtm::Update)]
#rtm(aggregate = BankAccount) // Add BankAccount fields to struct
struct JuniorAccount {
    minor: bool,
}

fn new(type: rtm::Command) {
    Self { minor = true, .. Default::default() }
}

fn create_junior_account(data: mut JuniorAccount){
    data.minor=true;
    data.verify_guardian()
        .create_account()
        .link_guardian_account();
}

fn delete_junior_account(data: mut JuniorAccount){ /*...*/ }
fn update_junior_account(data: mut JuniorAccount){ /*...*/ }

// If these functions are created by the user they are called before/after
// `create_junior_account_event(data: JuniorAccount)`
fn create_junior_account_event_before(data: JuniorAccount) {
    queue_mailout(data);
};
fn create_junior_account_event_after(data: JuniorAccount) {
    notify_branch(data);
};

#[derive(Domain)]
#[rtm(command = Create, type = JuniorAccount, version = "1.0.0")] // struct is a duplicate for doc purposes.
struct JuniorAccountCreation;
// Implements:
//
// struct JuniorAccountError;
// impl rtm::Error for JuniorAccountError;
// struct JuniorAccountServices;
// impl rtm::Services for JuniorAccountServices;
//
// #[async_trait]
// impl Domain for JuniorAccountCreation {
//     type Command = JuniorAccount;
//     type Type = Create;
//
//     fn new() {
//         Self { Default::default() }
//     }
//     // This should be implemented in the command type
//     fn execute() {
//         data = JuniorAccount::new(rtm::Create)
//                  .create_junior_account_event_before()
//                  .create_junior_account()
//                  .create_junior_account_event()
//                  .create_junior_account_event_after()
//     }
// }
```

### Domain

a.k.a Aggregate or AggregateRoot

```rust
#[derive(Domain)]
#[rtm(command = Create, type = JuniorAccount, version = "1.0.0")] // struct is a duplicate for doc purposes.
struct JuniorAccountCreation; // Add fields from JuniorAccount (Aggregate) to this struct

impl rtm::Service for JuniorAccountCreationServices {
     fn bank_authenticate() { /* ... */ }
     fn bank_authorize() { /* ... */ }
     fn guardian_validate() { /* ... */ }
}

// Implements:
#[async_trait]
impl Domain for JuniorAccountCreation {
    type Command = JuniorAccount;
    type Type = Create;
    type Event = JuniorAccount::Create;
    type Error = JuniorAccountCreationError;
    type Services = JuniorAccountCreationServices;
}

impl JuniorAccountCreation {
    fn execute(&self) -> Return<Self, Self::Error>{
        // Authentication
        let auth: rtm::Service = Services.get("bank_authenticate")?;
        // Authorization
        // Prepare data for command
        data = JuniorAccount{minor = true, ..};
        // Invoke command - this triggers `before_event`, `event`, `after_event`
        let event = Command::execute(data)?;
        Self::load(event)?
    }
}
```

### Event

The constraint of one command per event means we eliminate Events as a user
responsibility.  The following are macro generated.

```rust
impl rtm::Event for JuniorAccountEvent {
    fn event_type(&self) -> String {
        let event_type: &str = match self {
            JuniorAccount::Created { .. } => "JuniorAccount::Created",
            JuniorAccount::Updated { .. } => "JuniorAccount::Updated",
            JuniorAccount::Deleted { .. } => "JuniorAccount::Deleted",
            _ => "JuniorAccount::Errored",
        };
        event_type.to_string()
    }

    fn event_version(&self) -> String {
        "1.0.0".to_string()
    }
}

```
