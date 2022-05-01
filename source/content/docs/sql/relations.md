+++
title = "Relations"
description = "The heart of ROM."
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 20
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'The heart of ROM.'
toc = true
top = false
+++

To define an SQL relation you can use the standard way of defining relations in
ROM:

``` ruby
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

## Setting dataset (table) name explicitly

By default relation's `dataset` name is inferred from the class name. You can
override this easily:

``` ruby
module Relations
  class Users < ROM::Relation[:sql]
    schema(:users, infer: true)
  end
end
```

## Aliasing a relation

If your dataset name is not something that you'd like to use in your application,
you can easily alias relation so that it'll be accessible via your custom name:

``` ruby
module Relations
  class Users < ROM::Relation[:sql]
    schema(:AdminUsers, infer: true, as: :users)
  end
end
```

## Adjusting default dataset

Every relation is initialized with a default dataset which is set up based on schema.
This means that all columns are explicitly selected and relations are ordered by
primary key. If you want to change this, define your custom default dataset using a block:

``` ruby
module Relations
  class Users < ROM::Relation[:sql]
    schema(:users, infer: true)

    dataset do
      select(:id, :name).order(:name)
    end
  end
end
```
