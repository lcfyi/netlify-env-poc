# Netlify & Your Secrets

This is a proof-of-concept for a potential exploit that can be used to steal secret keys associated with your [Netlify](https://www.netlify.com/) website.

This is current as of **November 3, 2019**.

- [Netlify & Your Secrets](#netlify--your-secrets)
  - [FAQ](#faq)
    - [Huh?](#huh)
      - [Isn't Netlify mainly for hosting your static website?](#isnt-netlify-mainly-for-hosting-your-static-website)
      - [Then why do you have secret keys on your website?](#then-why-do-you-have-secret-keys-on-your-website)
    - [The Exploit](#the-exploit)
      - [How does it work?](#how-does-it-work)
        - [Component details](#component-details)
          - [Deploy previews](#deploy-previews)
          - [Environment variables](#environment-variables)
      - [The exploit, lite](#the-exploit-lite)
      - [But wait, can't I use a build context to prevent those keys from being leaked?](#but-wait-cant-i-use-a-build-context-to-prevent-those-keys-from-being-leaked)
      - [Can I see it in action?](#can-i-see-it-in-action)
      - [The scope seems *really* narrow](#the-scope-seems-really-narrow)

## FAQ

### Huh?

#### Isn't Netlify mainly for hosting your static website?

Yes.

#### Then why do you have secret keys on your website?

Even though Netlify's useful for static websites, they offer a lot of extra functionality that enable you to build super extensive web-apps without needing your own server, thanks to features like [serverless functions](https://docs.netlify.com/functions/overview/). Essentially, they're Lambda functions that you can roll into your Netlify website without worrying about having to configuring them beyond Netlify.

As such, they're incredibly useful for abstracting away secret keys that the function will use on behalf of the front-end.

In other words, welcome to the [JAMStack](https://jamstack.org/).

### The Exploit 

#### How does it work? 

The exploit involves an interaction between two components: deploy previews and your environment variables.

##### Component details

###### Deploy previews

Netlify offers the ability to generate [deploy previews](https://www.netlify.com/blog/2016/07/20/introducing-deploy-previews-in-netlify/), which are status checks for PRs that build a live-preview of the changes. They're incredibly useful since you can review a PR's changes without having to pull, build, and verify your changes yourself as Netlify will do that for you by generating a preview at `deploy-preview-<PR#>--<sitename>.netlify.com`.

This feature is on by default. 

###### Environment variables

[Environment variables](https://docs.netlify.com/configure-builds/environment-variables/), as the name suggests, are variables that are accessible during your build. They can either be set through your team settings, your site settings, or the `netlify.toml` file. Your `netlify.toml` configuration will override your site settings, which will override your team settings. In other words, it will read the `netlify.toml` file first, then your site settings, then your team settings to determine the environment variables.

In addition, you can set variables (and also basically every other configuration setting) per build context. Those build contexts can be `production`, `deploy-preview`, or `branch-deploy`. This will be important later. 

#### The exploit, lite

Assume a scenario where you have a public repo that Netlify builds. Within this repo, you have a lambda function that consumes a secret key to access an external service. We wouldn't want to commit those secret keys in the repo so we set them through the UI on Netlify's website. 

A bad actor can then come along and submit a PR that uses (and prints) your environment variables on the front-end; this malicious code will be automatically deployed by Netlify, which will expose the key. 

#### But wait, can't I use a build context to prevent those keys from being leaked? 

Sort of. You're able to specifiy a `[context.deploy-preview]` with environment variables specific to those deploys, which will prevent those secret keys in your `production` context from being exposed. However, a bad actor can simply comment out those lines in your `netlify.toml` that sets those context-specific environment variables, effectively bypassing those values. As mentioned previously, the build will then fall back to the environment variables set by your site (the UI). At the time of writing, there is not way to set context-specific environment variables through the UI, so it will expose the production keys. 

#### Can I see it in action?

This repo was set up as a Netlify website with all the default settings; it's a very simple site that uses webpack to clean up our 4-line js that prints out the `CONTEXT` and `SECRET` environment variables. The only change to the site's configuration on the website was within the build settings, where `SECRET` was set. In addition, we have a `netlify.toml` configuration which [sets the deploy preview variables](https://github.com/lcfyi/netlify-env-poc/blob/master/netlify.toml#L9) to mask our prod variables. 

You can view the production site [here](https://focused-wozniak-a06361.netlify.com/).

Now, a [non-malicious PR](https://github.com/lcfyi/netlify-env-poc/pull/1) was submitted, which generated a [deploy preview](https://deploy-preview-1--focused-wozniak-a06361.netlify.com/). Notice that our secret is now the value we set in the configuration file.

Finally, a [malicious PR](https://github.com/lcfyi/netlify-env-poc/pull/2) was submitted, which commented out the deploy preview settings in our configuration file. The [deploy preview](https://deploy-preview-2--focused-wozniak-a06361.netlify.com/) now exposes the production secret.


#### The scope seems *really* narrow

You're correct, it is. It requires a project to be public, deploy previews to be on (it is by default), *and* also for the project to consume secret keys. But given that combination, and you're (very unlikely, but still) in for a bad time. Or you could simply turn off deploy previews. 
