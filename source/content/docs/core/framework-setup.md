+++
title = "Framework setup"
description = "For simple, quick'n'dirty scripts that need to access databases."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 100
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "For simple, quick'n'dirty scripts that need to access databases."
toc = true
top = false
+++

Quick style setup is suitable for simple, quick'n'dirty scripts that need to access databases, in a typical application setup, you want to break down individual component definitions, like relations or commands, into separate files and define them as explicit classes.

{% note() %}
    Framework integrations **take care of the setup for you**.
    If you want to use RTM with a framework, please refer to specific
    instructions for that framework.
{% end %}

{% warning() %}
It is not currently possible for RTM macros and attributes (procedural
macros) to use crate local state.
This is tracked in [issue #44034](https://github.com/rust-lang/rust/issues/44034).
Consequently:

1. Proc macros may not be run on every compilation, for instance if incremental
   compilation is on and they are in a module that is clean
2. There is no guarantee of ordering -- if `do_it!` needs data from all
   `config!` invocations, that is a problem.

For these reasons, and others, you must adopt the following pattern:

1. Write the RTM portions of your application in a separate lib crate.
This has the advantage of forcing your application (domain) logic to be
separated from how you persist data.
2. In your RTM crate write the whole library within `mod rtm`.
Specifically:

```rust
// app-rtm/src/lib.rs
mod rtm {
  #![rtm(...)]

  // Everything else

}
```

{% end %}

## Flat-style Setup

To do setup in flat style, create a `rtm::Configuration` type.
This is the same object that gets yielded into your block in block-style setup,
so the API is identical.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
let configuration = rtm::Configuration::new("memory://test");
let container = ;
container.configuration.relation(User)
// ... etc
```

---

```ruby
configuration = ROM::Configuration.new(:memory, 'memory://test')
configuration.relation(:users)
# ... etc
```

{% end %}

When you’re finished configuring, pass the configuration object to
`rtm::Container::new(configuration)` to generate the finalized container.

There are no differences in the internal semantics between attribute-style and
flat-style setup.

### Registering Components

RTM components need to be registered with the RTM configuration in order to be
used.
If you prefer to create your components free of any crate or module organization
(i.e. quick-n-easy) you must register components with the configuration directly:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
let configuration = rtm::Configuration::new(Memory, "memory://test");
let container = rtm::Container::new(configuration);
//
// Declare Relations, Commands, and Mappers here
//
container.configure.relation(OneOfMyRelations)
container.configure.relation(AnotherOfMyRelations)
// Implementation hints: https://stackoverflow.com/a/57419729 or https://stackoverflow.com/a/30540869 or https://stackoverflow.com/a/25182801
container.configure.command("alias1", user_create); // Can we add to `inventory` without an alias/name?
container.configure.mapper("alias2", use_mapper) // Do we have to be able to run the command/mapper individually
```

---

```ruby
configuration = ROM::Configuration.new(:memory, 'memory://test')
#
# Declare Relations, Commands, and Mappers here
#
configure.relation(OneOfMyRelations)
configure.relation(AnotherOfMyRelations)
configure.command(User::CreateCommand)
configure.mapper(User::UserMapper)
```

{% end %}

### Auto-registration

RTM provides auto-registration as a convenient way to automatically register
components that are not declared using the DSL,
`configure.command(...), configure.mapper(...)`, etc[^1].

RTM uses three auto-registration mechanisms:

1. [Pending issue #41430](https://github.com/rust-lang/rust/issues/41430)
   Crate inner-attribute (global scope) loads all functions by module name
   conventions:
   - `relations`
   - `commands`
   - `mappers`
2. Module inner-attribute (module scope) loads all functions within the module.
3. Function outer-attributes load an individual function.

These mechanisms do not clash.  However, it is a user responsibility to ensure
a component is not registered more than once - by apply two mechanisms to a
component.

#### Crate inner-attribute: `#![rtm(...)]`

***Pending resolution of:***

- ***[Issue #41430](https://github.com/rust-lang/rust/issues/41430).***
- ***[Issue #54726](https://github.com/rust-lang/rust/issues/54726)***

If you do write components, then you can set up auto-registration using the
inner attribute, `#![rtm(...)]`, at the crate level:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
# my_app/src/lib.rs
// The Top Level Module (TLM)
mod rtm{ //This is a convention to workaround #41430 and #54726
  #![rtm(adapter = Memory, uri = "memory:///temp")]
  // Using defaults: `infer = true` and `register = true`
  // Sets up:
  // pub use rtm::Configuration;
  // configuration = crate::rtm::Configuration::new(Memory, "memory:///temp");
  // container = crate::rtm::Container::new(configuration);

  mod a {
    mod relations {
      // Add relation types here
      // Crate level #![rtm(...)], i.e. from the TLM registers all `struct` and `enum` within this module
    }
    mod b {
      mod commands {
        // Add command functions here
        // Crate level #![rtm(...)], i.e. from the TLM registers all `fn` within this module
      }
    }
    mod mappers {
      // Add mapper functions here
      // Crate level #![rtm(...)], i.e. from the TLM registers all `fn` within this module
    }
  }
}// end workaround for #41430 and #54726
```

---

```ruby
# Setup
configuration = ROM::Configuration.new(:memory)
configuration.auto_registration('/path/to/lib', namespace: 'Persistence')
container = ROM.container(configuration)

# lib/relations/users.rb
module Persistence
  module Relations
    class Users < ROM::Relation[:sql]
      schema(:users, infer: true)
    end
  end
end
```

{% end %}

Keep in mind with this crate-strategy:

1. each member of a component must be located within a module matching the component name:

  - `relations`
  - `commands`
  - `mappers`

2. All types (relations) and functions (commands and mapper) are registered.

#### Module inner-attribute: `#![rtm(...)]`

The module inner attribute `#![rtm(...)]` registers all functions in the module[^2].
By convention the table name is the `struct name` and detail of the `struct` is
then inferred from the table.
Using `#![rtm(infer = false)]` will produce an error, for reasons we will cover later:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
# lib/persistence/relations/users.rs
mod persistence {
  mod relations {
    #![rtm(adapter = Memory)] //# Notice the table names are inferred

    struct Users { /*...*/ }
    // Sets up
    // impl rtm::Relation<Memory> for Users;
    // Users::schema(Users, true); // Schema name is assumed to be `users`
  }
}

configuration = rtm::Configuration::new(Memory);
container = rtm::Container::new(configuration);
```

---

```ruby
# lib/persistence/relations/users.rb
module Persistence
  module Relations
    class Users < ROM::Relation[:memory]
      schema(:users, infer: true) # Notice the dataset name is set explicitly
    end
  end
end

configuration = ROM::Configuration.new(:memory)
configuration.auto_registration('root_dir/lib/persistence/')
container = ROM.container(configuration)

```

{% end %}

#### Function & enum/struct/type outer-attribute: `#[rtm(...)]`

The function outer-attribute `#[rtm(...)]` registers only the function or
struct/enum/type the attribute is above.

The default is to treat the `#[rtm]` (no arguments) attribute as being explicit
the function or struct/type follow the RTM conventions:

1. Any `enum`, `struct` or `type` is a relation.
1. The `enum`, `struct` or `type` structure is as defined in the data store.
1. Any function name containing ***words***:
   - `cmd`, `cmds`, `command` is registered as a command.
   - `map`,`maps`, `mapper` is registered as a mapper.
1. infer the schema name and structure by convention.

Using `#![rtm(infer = false)]` will not produce an error - this is useful when
dealing with legacy datastores.

##### Enum/struct/type

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
# lib/persistence/rel/users.rs

mod persistence {
  mod rel { // Not 'relations` module name

    #[derive(Relation)]
    #[rtm]
    struct Users { /*...*/ }
    //
    // https://github.com/rust-lang/rust-analyzer/issues/9115
    // CARGO_MANIFEST_DIR will point to the crate root of the crate currently
    // compiling. The proc-macro can read it at runtime (std::env::var() or
    // std::env::current_dir()).
    // If the proc macro would read it during the compilation of itself (env!())
    // then CARGO_MANIFEST_DIR would point to the crate root of the proc macro
    //
    // Default adapter is read from workspace or cargo root.
    // Implementation:
    // https://stackoverflow.com/questions/58768109/proper-way-to-handle-a-compile-time-relevant-text-file-passed-to-a-procedural-ma
    // https://stackoverflow.com/a/60740275
    //
    // See also: [Tracking issue for proc_macro::Span inspection APIs](https://github.com/rust-lang/rust/issues/54725)
    //
    // Implements:
    //     struct Users { /*...*/ };
    //     impl rtm::Relation<crate::Rtm.configuration.adapter> for Users;
    //     Users::schema(Users, true); // Schema name is assumed to be `users`
    //     crate::rtm::Configuration.relation(Users);

    #[derive(Relation)]
    #[rtm]
    enum Posts { /*...*/ }
  }
}

configuration = rtm::Configuration::new(Memory, "memory:///temp");
container = rtm::Container::new(configuration);
```

---

```ruby
# lib/persistence/relations/users.rb
module Persistence
  module Relations
    class Users < ROM::Relation[:memory]
      schema(:users, infer: true) # Notice the dataset name is set explicitly
    end
  end
end

configuration = ROM::Configuration.new(:memory)
configuration.auto_registration('root_dir/lib/persistence/')
container = ROM.container(configuration)
```

{% end %}

##### Function

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
// Commands
//
// lib/persistence/commands.rs
mod persistence {
  mod commands {

    #[rtm(relation = Users, type = CommandsCreate, alias = "short")]
    fn create_user_command(self: impl rtm::Relation, data: impl HashMap) {
      // somethings with `mine` and `too` where too has field data
      // self // is the relation
      // self.configuration.adapter
      // self.configuration.schema
      // self.configuration.infer
      // Using `self.connection` would be an anti-pattern for CQRS, but
      // maybe required in other cases.
    }
    // Implementation:
    // https://stackoverflow.com/a/57419729 or
    // https://stackoverflow.com/a/30540869 or
    // https://stackoverflow.com/a/25182801
    //
    // struct Cmd {
    //   name: &'static str,
    //   call: fn(),
    // }
    // impl rtm::Sql::Commands::Create for Users {
    //   fn short(self, args: HashMap ) { self.update_user_command(args) }
    // };
    // inventory::submit!(Cmd(name: "short", call: update_user_command));
    // inventory::collect!(Cmd);
    // impl Users {
    //   fn commands() -> {
    //       let mut registry = BTreeMap::new();
    //       // Access the registry
    //       for cmd in inventory::iter::<Cmd> {
    //           registry.insert(cmd.name, cmd);
    //       }
    //       registry
    //   }
    // }
  }
}

let users = Users { /* ... */ };
let my_creation = users.short(HashMap::new("name", "Jane"));
let my_creation = short(users, HashMap::new("name", "Jane"));
let my_creation = if let Some(cmd) = users.commands().get("short"){
  (cmd.call)(users, HashMap::new("name", "Jane"));
}

// Mappers
//
// lib/persistence/mappers.rs
mod persistence {
  mod mappers {

    #[rtm(component=mapper, relation = Users, type = rtm::Transform, alias = short1)]
    fn user_helper(self: impl rtm::Relation, data: impl HashMap) {}

    #[rtm(relation = Users, type = rtm::Transform, alias = "short2")]
    fn user_map_me(self: impl rtm::Relation, data: impl HashMap) {}

    #[rtm(relation = Users, type = rtm::Transform, alias = "short3")]
    fn user_mapper_helper(self: impl rtm::Relation, data: impl HashMap) {
      // somethings with `mine` and `too` where too has field data
      // self // is the relation
      // self.configuration.adapter
      // self.configuration.schema
      // self.configuration.infer
      // Using `self.connection` would be an anti-pattern for CQRS, but maybe
      // required in other cases.
    }
    // Implementation:
    // https://stackoverflow.com/a/57419729 or
    // https://stackoverflow.com/a/30540869 or
    // https://stackoverflow.com/a/25182801
    //
    // struct Cmd {
    //   name: &'static str,
    //   call: fn(),
    // }
    // impl rtm::Sql::Commands::Create for Users {
    //   fn short(self, args: HashMap ) { self.update_user_command(args) }
    // };
    // inventory::submit!(Cmd(name: "short", call: update_user_command));
    // inventory::collect!(Cmd);
    // impl Users {
    //   fn commands() -> {
    //       let mut registry = BTreeMap::new();
    //       // Access the registry
    //       for cmd in inventory::iter::<Cmd> {
    //           registry.insert(cmd.name, cmd);
    //       }
    //       registry
    //   }
    // }
  }
}

users.map_with(user_mapper).to_vec

```

---

```ruby
# Commands
#
# lib/commands/update_user_command.rb
module Persistence
  module Commands
    class UpdateUserCommand < ROM::SQL:Commands::Create
      relation :users
      register_as :update_user_command

      def execute(tuple); end
    end
  end
end

users = Users:new();
my_command = users.command(:update_user_command)
my_command.call(name: "Jane")

# Mappers
#
# lib/mappers/user_mapper.rb
module Persistence
  module Mappers
    class UserMapper < ROM::Transformer
      relation :users
      register_as :user_mapper

      map_array do; end
    end
  end
end
```

{% end %}


#### Registering outside the namespace conventions

You can also keep all components under modules different from the convention of
`commands`, `mappers`, `relations`.  You can auto-register components using the
[Module inner-attribute](#module-inner-attribute), or register components
individually using the [Function out-attribute](#function-outer-attribute).

Only the [Crate inner-attribute](#crate-inner-attribute) auto-registration will
not work.

## Relations

Relations can be defined with a type implementing the `rtm::Relation` trait
provided/defined by the appropriate adapter.  All functions implemented for
the relation must return the relation type.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
// Defines a Users relation for the SQL adapter
struct Users { /*...*/ }
impl rtm::Relation<Sql> for Users;

// Defines a Posts relation for the HTTP adapter
struct Posts { /*...*/ }
impl rtm::Relation<Http> for Posts;
```

---

```ruby
# Defines a Users relation for the SQL adapter
class Users < ROM::Relation[:sql]

end

# Defines a Posts relation for the HTTP adapter
class Posts < ROM::Relation[:http]

end
```

{% end %}

Relations can declare the specific [gateway](/help/glossary#gateway) and
[dataset](/help/glossary#dataset) it takes data from, as well as the registered
name of the relation.
The following example sets the default options explicitly:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```ruby
class Users < ROM::Relation[:sql]
  gateway :default # the gateway name, as defined in setup

  # the first argument to schema() is the dataset name;
  # by default it is inferred from the class name
  #
  # `as:` provides the registered name;
  # under this name the relation will be available in repositories
  schema(:users, as: :users) do
    # ...
  end
end
```

---

```rust
struct Users
impl rtm::Relation<Sql> for Users;

  // The first argument to schema() is the dataset name;
  // by default it is inferred from the class name
  //
  // The next argument, `alias`, provides the registered name.
  // The relation will be available under this name in repositories
  // Implementation:
  // https://users.rust-lang.org/t/solved-calling-a-default-subtrait-method-from-the-supertrait-default-method/39648/4
  schema(|Users, "users"|{
    // whatever is required
   })
end
```

{% end %}

## Commands

Just like Relations, Commands can be defined as explicit classes:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class CreateUser < ROM::Commands::Create[:memory]

end
```

---

```rust
class CreateUser < ROM::Commands::Create[:memory]

end
```

{% end %}

Commands have three settings:

1. their relation, which takes the registered name of a relation;
2. their result type, either `:one` or `:many`; and
3. their registered name.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class CreateUser < ROM::Commands::Create[:memory]
   register_as :create
   relation :users
   result :one
end
```

---

```rust
struct CreateUser
impl rtm::Commands::Create<Memory> for CreateUser;
CreateUser::register_as("create");
CreateUser::relation(Users);
CreateUser::result();
```

{% end %}

{% info() %}
Typically, you're going to use the [repository command interface and changesets](/repositories/quick-start);
custom command types are useful when the built-in command support in
repositories doesn't meet your requirements.
{% end %}

### Footnotes

[^1]: Equivalent functionality in ROM requires a base directory  (as a minimum).
A requirement to keep generated names short, and prevent name clashes, means
the dataset name must be provided to every component.
By default then, ROM loads relations from `<base>/relations`, commands from
`<base>/commands`, and mappers from `<base>/mappers`.

[^2]: One could workaround this issue, by wrapping the whole library in a module.
We'd prefer to wait on some resolution of issue #41430.
