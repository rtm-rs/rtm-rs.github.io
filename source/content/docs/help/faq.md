+++
title = "FAQ"
description = "Answers to frequently asked questions."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "Answers to frequently asked questions."
toc = true
top = false
+++

## What is RTM?

Rust Type Mapper (RTM) is an open-source persistence and mapping toolkit for Rust built for speed and simplicity.
The toolkit is modelled on the [Ruby Object Mapper (v5.0)](https://rom-rb.org).
As such the principal use cases are (non-trivial) prototyping through to production.

## Is RTM a CQRS-ES framework?

***RTM is not a CQRS and/or ES framework.*** - Command and Query Responsibility
Segregation (CQRS), is a way of organizing your application so that reading
data is separated from changing data - the responsibility of handling commands
(mutations) from the responsibility of handling side-effect-free query/read access.
Event Sourcing (ES) uses the generated events as the source of truth for the state of the application.
In RTM part of this pattern is easily achievable by using [relations](./glossary/#relation) and [commands](./glossary/#command).

**Because RTM may be useful when implementing a CQRS pattern, it does not
follow that a project adopting RTM must or will be committing to the full
complexity of CQRS or Event-Sourcing.**
It is not yet clear, from practice, whether a project that needs the head-room
of CQRS-ES will be able to utilise RTM all the way.  However we are interested
in supporting these usecases until we can't, so please open feature and issue
reports if you encounter any difficulties.

Martin Fowler has a succinct synopsis of [CQRS and its downsides](https://martinfowler.com/bliki/CQRS.html).

The [`cqrs-es`](https://doc.rust-cqrs.org/intro.html) crate provides a
lightweight framework for building applications utilizing CQRS and event sourcing.

Some useful references are collected [here](https://gist.github.com/brendanzab/a6073e73f751a6ca9750f960a92f2afe)

## Other documentation?

- Crate documents
  - [rtm-rs](https://docs.rs/rtm-rs/)
  - [rtm-sql](https://docs.rs/rtm-sql/)
  - [rtm-csv](https://docs.rs/rtm-http/)
  - [rtm-factory](https://docs.rs/rtm-factory/)
  - [rtm-http](https://docs.rs/rtm-http/)
  - [rtm-json](https://docs.rs/rtm-json/)
  - [rtm-yaml](https://docs.rs/rtm-yaml/)

## Keyboard shortcuts for search?

- focus: `/`
- select: `↓` and `↑`
- open: `Enter`
- close: `Esc`

## Contact the creator?

Send *Mark* an E-mail, however we'd prefer light-weight RFC's then pull-requests 🥇:

- <mark@taqtiqa.com>
