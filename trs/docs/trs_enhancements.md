---
title: TRS Contract Enhancements
author: yulong
date: 2017-10-1
---

# TRS Contract Enhancements

This document details the proposed enhancements by Nuco to the TRS contract, with focus on security check and time measurements.

## Improvements to the ``withdrawTo()`` function

The implementation of ``withdrawTo()`` function was heavily discussed internally, based on the feedback from both BokkyPooBah and New Alchemy. The main concerns are related to security and testability, given that the logic of this function is complicated, relatively speaking.

To avoid potential vulnerability, two changes were proposed to this function:

1. Split ``withdrawTo()`` into several functions of smaller size;
2. Add security asserts (e.g. overflow and condition guards) at major breakpoints.

## Replace block number with block timestamp

The block time of Ethereum has been unstable and unreliable recently, due to both the Ice Age difficulty adjustment schema and the potential Metropolis hard fork. Considering this situation, we propose to replace block number with block timestamp as a time metric for our token sale phases.

## Add pause() function

The reason of adding pause() function is to freeze the funds in case of extreme conditions, for instance, Ethereum splits because of hard fork and Aion has to choose one fork to keep the bridging protocol working.
