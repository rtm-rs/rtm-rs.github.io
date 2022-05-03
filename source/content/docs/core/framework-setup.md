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

## Flat-style Setup

To do setup in flat style, create a `rtm::Configuration` type.
This is the same object that gets yielded into your block in block-style setup, so the API is identical.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
configuration = rtm::Configuration::new('memory://test')
configuration.relation(User)
# ... etc
```

---

```ruby
configuration = ROM::Configuration.new(:memory, 'memory://test')
configuration.relation(:users)
# ... etc
```

{% end %}

When you’re finished configuring, pass the configuration object to `rtm::Container::new(configuration)` to generate the finalized container. There are no differences in the internal semantics between builder-style and flat-style setup.

### Registering Components

RTM components need to be registered with the RTM configuration in order to be used.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
configuration = rtm::Configuration::new('memory://test')

# Declare Relations, Commands, and Mappers here
```

---

```ruby
configuration = ROM::Configuration.new(:memory, 'memory://test')

# Declare Relations, Commands, and Mappers here
```

{% end %}

If you prefer to create explicit types for your components you must register them with the configuration directly:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
configure = rtm::Configuration::new('memory://test')

configure.relation(OneOfMyRelations)
configure.relation(AnotherOfMyRelations)
configure.command(User::CreateCommand)
configure.mapper(User::UserMapper)
// OR if we don't need a Struct to implement a Trait on,
// we could pass in the functions directly.
// Implementation hints: https://stackoverflow.com/a/57419729 or https://stackoverflow.com/a/30540869 or https://stackoverflow.com/a/25182801
configure.command("alias1", user_create); // Can we add to `inventory` without an alias/name?
configure.mapper("alias2", use_mapper) // Do we have to be able to run the command/mapper individually
```

---

```ruby
configure = ROM::Configuration.new(:memory, 'memory://test')

configure.relation(OneOfMyRelations)
configure.relation(AnotherOfMyRelations)
configure.command(User::CreateCommand)
configure.mapper(User::UserMapper)
```

{% end %}

You can pass multiple components to each 'register' call, as a list of arguments.

### Auto-registration

RTM provides auto-registration as a convenience method for automatically registering components that are not declared using the DSL,
`configure.command(...), configure.mapper(...)`, etc.

The ROM equivalent requires a base directory - this also imposes a requirement to provide the dataset name to every component.  By default then, ROM loads relations from `<base>/relations`, commands from `<base>/commands`, and mappers from `<base>/mappers`.

RTM uses an inner attribute to load all functions within a module. Or a function attribute to load an individual function in any module.  As well as additional flexibility, we do not need to configure RTM with folder or module names.

#### Inner attribute: `#![rtm(...)]`

RTM auto-registration using the module inner attribute `#![rtm(...)]` registers
all functions in the module:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

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

---

```rust
# lib/persistence/relations/users.rs
let infer = true;
struct Users { /*...*/ };
mod persistence {
  mod relations {
    #![rtm(schema = Users, infer = true)] # Notice the dataset name is set explicitly

    impl rtm::Relation<Memory> for Users;
    // Users::schema(Users, infer);
    // Or
    // #[derive(Relation)]
    // #[rtm(adapter = Memory, schema = Users, infer = true)]
    // struct Users { /*...*/ }
  }
}

configuration = rtm::Configuration::new(Memory);
configuration.auto_registration("root_dir/lib/persistence/");
container = rtm::Container::new(configuration);
```

{% end %}

{% info() %}
In this scenario the [Dataset](/help/glossary#dataset) name will need to be set explicitly otherwise the fully qualified relation name will be used, in this case `:persistence_relations_users`.
{% end %}

#### Explicit namespace name

If your directory structure doesn't reflect module/type organization but you do namespace components, then you can set up auto-registration via `:namespace` option:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
# lib/relations/users.rs
mod persistence {
  mod relations {
    #[derive(Relation)]
    #[rtm(adapter = Memory, schema = Users, infer = true)]
    struct Users { /*...*/ }
  }
}
```

---

```ruby
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

Notice that the directory structure is different from our module structure.
Since we use `persistence` as our namespace, we need to set it explicitly so
RTM can locate our relation after loading:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
let container = rtm!(register = true, adapter = Memory, module = persistence, path = "/path/to/lib");
println!("{:#?}", container.configuration);
// configuration = rtm::Configuration::new(Memory);
// configuration.auto_registration("/path/to/lib", "persistence");
// container = rtm::Container::new(configuration);
```

---

```ruby
configuration = ROM::Configuration.new(:memory)
configuration.auto_registration('/path/to/lib', namespace: 'Persistence')
container = ROM.container(configuration)
```

{% end %}

Keep in mind with this namespace strategy, each component must be located
within the module matching the component name, i.e. `commands`, `mappers`.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
# Commands
#
# lib/commands/update_user_command.rs
mod persistence {
  mod commands {
    #[rtm(relation = Users, type = CommandCreate, alias = short)]
    fn update_user_command(self: impl rtm::Relation, data: impl HashMap) {
      // somethings with `mine` and `too` where too has field data
      // self // is the relation
      // self.configuration.adapter
      // self.configuration.schema
      // self.configuration.infer
      // Accessing `too.connection` would be an anti pattern for CQRS, but maybe required in other cases.
    }
    // Implementation: https://stackoverflow.com/a/57419729 or https://stackoverflow.com/a/30540869 or https://stackoverflow.com/a/25182801
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

// Initialized far away:
// let users = Users { /*...*/ };
let my_creation = users.short(HashMap::new("name", "Jane"));
let my_creation = short(users, HashMap::new("name", "Jane"));
if let Some(cmd) = users.commands().get("short"){
  (cmd.call)(users, HashMap::new("name", "Jane"));
}

# Mappers
#
# lib/mappers/user_mapper.rs
mod persistence {
  mod mappers {
    struct UserMapper { /*...*/ };
    impl rtm::Transformer for UserMapper {
      fn map_array(||{})
    };
    UserMapper::relation(Users);
    UserMapper::register_as(user_mapper);
    // OR (implementation: https://stackoverflow.com/a/57419729 or https://stackoverflow.com/a/30540869 or https://stackoverflow.com/a/25182801)
    // #[derive(Transformer)]
    // #[rtm(relation = Users, mapper_name = user_mapper)]
    // struct UpdateUserCommand { /**/ };
  }
}

users.map_with(user_mapper).to_a

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

If your components are under a nested namespace like `my_app::persistence`,
like this:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# lib/relations/users.rb
module MyApp
  module Persistence
    module Relations
      class Users < ROM::Relation[:sql]
        schema(:users, infer: true)
      end
    end
  end
end
```

---

```rust
# lib/relations/users.rs
let infer = true;
mod my_app {
  mod persistence {
    mod relations {
      struct Users { /*...*/ }
      impl rtm::Relation<Sql> for Users;
      Users::schema(Users, infer)
    }
  }
}
```

{% end %}

Then, auto-registration can be achieved with by send your nested namespace as
the `namespace` argument to `#auto_registration`, like so:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
configuration.auto_registration('/path/to/lib', namespace: 'MyApp::Persistence')
```

---

```rust
configuration.auto_registration('/path/to/lib', namespace: "my_app::persistence")
```

{% end %}
---

#### Turning namespace off

If you keep all components under `{path}/(relations|commands|mappers)` directories and don't namespace them, then you can simply turn namespacing off:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# lib/relations/users.rb
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

---

```rust
# lib/relations/users.rb
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

{% end %}

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
configuration = ROM::Configuration.new(:memory)
configuration.auto_registration('/path/to/lib', namespace: false)
container = ROM.container(configuration)
```

---

```rust
configuration = ROM::Configuration.new(:memory)
configuration.auto_registration('/path/to/lib', namespace: false)
container = ROM.container(configuration)
```

{% end %}

## Relations

Relations can be defined with a class extending `ROM::Relation` from the appropriate adapter.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# Defines a Users relation for the SQL adapter
class Users < ROM::Relation[:sql]

end

# Defines a Posts relation for the HTTP adapter
class Posts < ROM::Relation[:http]

end
```

---

```rust
# Defines a Users relation for the SQL adapter
class Users < ROM::Relation[:sql]

end

# Defines a Posts relation for the HTTP adapter
class Posts < ROM::Relation[:http]

end
```

{% end %}

Relations can declare the specific [gateway](/learn/introduction/glossary#gateway) and [dataset](/learn/introduction/glossary#dataset) it takes data from, as well as the registered name of the relation. The following example sets the default options explicitly:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

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

Commands have three settings: their relation, which takes the registered name of a relation; their result type, either `:one` or `:many`; and their registered name.

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
class CreateUser < ROM::Commands::Create[:memory]
   register_as :create
   relation :users
   result :one
end
```

{% end %}

{% info() %}
Typically, you're going to use [repository command interface and changesets](/learn/repository/%{version}/quick-start); custom command types are useful when the built-in command support in repositories doesn't meet your requirements.
{% end %}
