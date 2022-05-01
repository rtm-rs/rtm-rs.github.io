+++
title = "Quick Start"
description = "One page summary of how to start a new RTM project."
date = 2022-05-01T08:20:00+00:00
updated = 2022-05-01T08:20:00+00:00
draft = false
weight = 20
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "One page summary of how to start a new RTM project."
toc = true
top = false
+++

## Requirements

Before using the toolkit, you need to install [Rust](https://www.rust-lang.org/tools/install/) ≥ 1.59.0.

### Step 1: Create a new RTM project

Clone the examples repository:

```bash
git clone --depth=1 https://github.com/rtm-rs/rtm-examples.git
```

### Step 2: Build quick-start example

```bash
pushd quick-start
cargo build
cargo test
```

### Step 3: Add new functionality

### Step 4: Run the project tests

```bash
cargo test
```

{% fenced_code_tab(tabs=["rust", "C", "java"]) %}
```rust
prinln!("Hello World!");
```
---
```C
prinf("Hello World!\n");
```
---
```java
system.out.println("Hello World!");
```
{% end %}
